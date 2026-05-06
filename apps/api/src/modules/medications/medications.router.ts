import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { emitAlert } from '../../websocket/alert.socket'

const CreateMedicationSchema = z.object({
  name: z.string().min(1),
  dosage: z.string(),
  frequency: z.enum(['ONCE_DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'WEEKLY_ONCE', 'AS_NEEDED']),
  startDate: z.string(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
})

export async function medicationsRouter(app: FastifyInstance) {
  app.get('/:patientId/medications', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { patientId } = req.params as { patientId: string }
    const { active } = req.query as { active?: string }

    const medications = await app.prisma.medication.findMany({
      where: { patientId, ...(active === 'true' && { isActive: true }) },
      include: { logs: { orderBy: { takenAt: 'desc' }, take: 5 } },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send(medications)
  })

  app.post('/:patientId/medications', {
    preHandler: [app.authorize(['PATIENT', 'SYSTEM_ADMIN'])],
  }, async (req, reply) => {
    const { patientId } = req.params as { patientId: string }
    const body = CreateMedicationSchema.parse(req.body)

    const medication = await app.prisma.medication.create({
      data: { patientId, ...body, startDate: new Date(body.startDate), endDate: body.endDate ? new Date(body.endDate) : undefined },
    })
    return reply.status(201).send(medication)
  })

  app.patch('/medications/:id', {
    preHandler: [app.authorize(['PATIENT', 'SYSTEM_ADMIN'])],
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = CreateMedicationSchema.partial().parse(req.body)
    const medication = await app.prisma.medication.update({ where: { id }, data: body })
    return reply.send(medication)
  })

  app.delete('/medications/:id', {
    preHandler: [app.authorize(['PATIENT', 'SYSTEM_ADMIN'])],
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    await app.prisma.medication.update({ where: { id }, data: { isActive: false } })
    return reply.send({ success: true })
  })

  app.post('/medications/:id/log/taken', {
    preHandler: [app.authorize(['PATIENT', 'SYSTEM_ADMIN'])],
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const medication = await app.prisma.medication.findUniqueOrThrow({ where: { id } })

    const log = await app.prisma.medicationLog.create({
      data: { medicationId: id, confirmed: true },
    })

    // Award bonus points for adherence
    const patient = await app.prisma.patient.findUnique({ where: { id: medication.patientId } })
    if (patient?.insuranceId) {
      await app.prisma.bonusPoint.create({
        data: {
          patientId: medication.patientId,
          insuranceId: patient.insuranceId,
          points: 10,
          reason: `${medication.name} eingenommen`,
          category: 'MEDICATION_ADHERENCE',
        },
      })
    }

    return reply.status(201).send(log)
  })

  app.post('/medications/:id/log/skipped', {
    preHandler: [app.authorize(['PATIENT', 'SYSTEM_ADMIN'])],
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { skippedReason } = req.body as { skippedReason?: string }
    const medication = await app.prisma.medication.findUniqueOrThrow({ where: { id } })

    const log = await app.prisma.medicationLog.create({
      data: { medicationId: id, confirmed: false, skippedReason },
    })

    const alert = await app.prisma.alert.create({
      data: {
        patientId: medication.patientId,
        alertType: 'MEDICATION_MISSED',
        severity: 'MEDIUM',
        message: `${medication.name} wurde nicht eingenommen${skippedReason ? `: ${skippedReason}` : ''}`,
      },
    })
    emitAlert(medication.patientId, alert as any)

    return reply.status(201).send(log)
  })
}
