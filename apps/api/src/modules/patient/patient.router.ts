import { FastifyInstance } from 'fastify'
import { z } from 'zod'

const UpdatePatientSchema = z.object({
  fullName: z.string().optional(),
  phone: z.string().optional(),
  consentGiven: z.boolean().optional(),
})

const CreateFamilyMemberSchema = z.object({
  fullName: z.string(),
  relationship: z.string(),
  email: z.string().email(),
  notificationsEnabled: z.boolean().default(true),
})

const CreateAppointmentSchema = z.object({
  title: z.string(),
  appointmentDate: z.string(),
  doctorName: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
})

export async function patientRouter(app: FastifyInstance) {
  app.get('/me', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const patient = await app.prisma.patient.findUnique({
      where: { userId: req.user.userId },
      include: { insurance: true },
    })
    if (!patient) return reply.status(404).send({ error: 'Patient not found' })
    return reply.send(patient)
  })

  app.patch('/me', {
    preHandler: [app.authorize(['PATIENT'])],
  }, async (req, reply) => {
    const body = UpdatePatientSchema.parse(req.body)
    const patient = await app.prisma.patient.update({
      where: { userId: req.user.userId },
      data: body,
    })
    return reply.send(patient)
  })

  // Family Members
  app.get('/:patientId/family', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { patientId } = req.params as { patientId: string }
    const family = await app.prisma.familyMember.findMany({ where: { patientId } })
    return reply.send(family)
  })

  app.post('/:patientId/family', {
    preHandler: [app.authorize(['PATIENT', 'SYSTEM_ADMIN'])],
  }, async (req, reply) => {
    const { patientId } = req.params as { patientId: string }
    const body = CreateFamilyMemberSchema.parse(req.body)
    const member = await app.prisma.familyMember.create({ data: { patientId, ...body } })
    return reply.status(201).send(member)
  })

  app.delete('/family/:id', {
    preHandler: [app.authorize(['PATIENT', 'SYSTEM_ADMIN'])],
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    await app.prisma.familyMember.delete({ where: { id } })
    return reply.send({ success: true })
  })

  // Appointments
  app.get('/:patientId/appointments', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { patientId } = req.params as { patientId: string }
    const appointments = await app.prisma.appointment.findMany({
      where: { patientId },
      orderBy: { appointmentDate: 'asc' },
    })
    return reply.send(appointments)
  })

  app.post('/:patientId/appointments', {
    preHandler: [app.authorize(['PATIENT', 'SYSTEM_ADMIN'])],
  }, async (req, reply) => {
    const { patientId } = req.params as { patientId: string }
    const body = CreateAppointmentSchema.parse(req.body)
    const appointment = await app.prisma.appointment.create({
      data: { patientId, ...body, appointmentDate: new Date(body.appointmentDate) },
    })
    return reply.status(201).send(appointment)
  })

  app.patch('/appointments/:id', {
    preHandler: [app.authorize(['PATIENT', 'SYSTEM_ADMIN'])],
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = CreateAppointmentSchema.partial().parse(req.body)
    const appointment = await app.prisma.appointment.update({ where: { id }, data: body })
    return reply.send(appointment)
  })

  // Wearable Devices
  app.get('/:patientId/devices', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { patientId } = req.params as { patientId: string }
    const devices = await app.prisma.wearableDevice.findMany({ where: { patientId } })
    return reply.send(devices)
  })

  app.post('/:patientId/devices', {
    preHandler: [app.authorize(['PATIENT', 'SYSTEM_ADMIN'])],
  }, async (req, reply) => {
    const { patientId } = req.params as { patientId: string }
    const body = req.body as any
    const device = await app.prisma.wearableDevice.create({ data: { patientId, ...body } })
    return reply.status(201).send(device)
  })

  // Bonus
  app.get('/:patientId/bonus', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { patientId } = req.params as { patientId: string }
    const points = await app.prisma.bonusPoint.findMany({
      where: { patientId },
      orderBy: { earnedAt: 'desc' },
    })
    const total = points.reduce((sum, p) => sum + p.points, 0)
    return reply.send({ points, total })
  })
}
