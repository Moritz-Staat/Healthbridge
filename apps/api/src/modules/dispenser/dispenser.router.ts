import { FastifyInstance } from 'fastify'
import { emitAlert } from '../../websocket/alert.socket'
import { z } from 'zod'

const DispenseEventSchema = z.object({
  medicationId: z.string(),
  dispensedAt: z.string().optional(),
  confirmed: z.boolean().default(true),
  errorCode: z.string().optional(), // z.B. "JAM", "EMPTY", "POWER_LOSS"
})

export async function dispenserRouter(app: FastifyInstance) {
  // Hardware Webhook — Dispenser meldet Ausgabe
  app.post('/webhook/:deviceId', async (req, reply) => {
    const { deviceId } = req.params as { deviceId: string }

    // Simple API-Key Auth für Hardware (X-Device-Token Header)
    const deviceToken = req.headers['x-device-token']

    const device = await app.prisma.wearableDevice.findFirst({
      where: { id: deviceId, deviceType: 'SMART_DISPENSER', isActive: true },
    })
    if (!device) return reply.status(404).send({ error: 'Device not found' })

    const body = DispenseEventSchema.parse(req.body)

    const log = await app.prisma.medicationLog.create({
      data: {
        medicationId: body.medicationId,
        takenAt: body.dispensedAt ? new Date(body.dispensedAt) : new Date(),
        confirmed: body.confirmed,
        skippedReason: body.errorCode ? `Dispenser-Fehler: ${body.errorCode}` : undefined,
      },
    })

    // Bei Fehler: Alert auslösen
    if (!body.confirmed && body.errorCode) {
      const medication = await app.prisma.medication.findUnique({ where: { id: body.medicationId } })
      if (medication) {
        const alert = await app.prisma.alert.create({
          data: {
            patientId: device.patientId,
            alertType: 'MEDICATION_MISSED',
            severity: 'HIGH',
            message: `Dispenser-Fehler bei ${medication.name}: ${body.errorCode}`,
          },
        })
        emitAlert(device.patientId, alert as any)
      }
    }

    return reply.send({ success: true, logId: log.id })
  })

  // Status des Dispensers für einen Patienten
  app.get('/patient/:patientId/status', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { patientId } = req.params as { patientId: string }

    const device = await app.prisma.wearableDevice.findFirst({
      where: { patientId, deviceType: 'SMART_DISPENSER' },
    })
    if (!device) return reply.send({ hasDispenser: false })

    const medications = await app.prisma.medication.findMany({
      where: { patientId, isActive: true },
      include: {
        logs: { orderBy: { takenAt: 'desc' }, take: 5 },
      },
    })

    // Letztes Dispenser-Event
    const lastLog = await app.prisma.medicationLog.findFirst({
      where: { medication: { patientId } },
      orderBy: { takenAt: 'desc' },
      include: { medication: true },
    })

    return reply.send({
      hasDispenser: true,
      device,
      medications,
      lastDispensedAt: lastLog?.takenAt ?? null,
      lastMedication: lastLog?.medication?.name ?? null,
    })
  })

  // Simulate: Dispenser bestätigt Einnahme (Demo-Button im Frontend)
  app.post('/patient/:patientId/simulate-dispense', {
    preHandler: [app.authorize(['PATIENT', 'SYSTEM_ADMIN'])],
  }, async (req, reply) => {
    const { patientId } = req.params as { patientId: string }
    const { medicationId } = req.body as { medicationId: string }

    const device = await app.prisma.wearableDevice.findFirst({
      where: { patientId, deviceType: 'SMART_DISPENSER' },
    })
    if (!device) return reply.status(404).send({ error: 'No dispenser registered' })

    const medication = await app.prisma.medication.findUniqueOrThrow({ where: { id: medicationId } })

    const log = await app.prisma.medicationLog.create({
      data: {
        medicationId,
        takenAt: new Date(),
        confirmed: true,
        skippedReason: undefined,
      },
    })

    // Bonus-Punkte vergeben
    const patient = await app.prisma.patient.findUnique({ where: { id: patientId } })
    if (patient?.insuranceId) {
      await app.prisma.bonusPoint.create({
        data: {
          patientId,
          insuranceId: patient.insuranceId,
          points: 10,
          reason: `${medication.name} via Dispenser eingenommen`,
          category: 'MEDICATION_ADHERENCE',
        },
      })
    }

    return reply.send({ success: true, log })
  })
}
