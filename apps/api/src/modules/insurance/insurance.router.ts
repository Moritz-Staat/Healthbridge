import { FastifyInstance } from 'fastify'
import { z } from 'zod'

const AwardBonusSchema = z.object({
  patientId: z.string(),
  points: z.number().int().positive(),
  reason: z.string(),
  category: z.enum(['MEDICATION_ADHERENCE', 'ACTIVITY_GOAL', 'REGULAR_CHECK_IN', 'HEALTH_IMPROVEMENT']),
})

export async function insuranceRouter(app: FastifyInstance) {
  app.get('/me', {
    preHandler: [app.authorize(['INSURANCE_ADMIN'])],
  }, async (req, reply) => {
    const admin = await app.prisma.insuranceAdmin.findUnique({
      where: { userId: req.user.userId },
      include: { insurance: true },
    })
    return reply.send(admin)
  })

  app.get('/me/patients', {
    preHandler: [app.authorize(['INSURANCE_ADMIN'])],
  }, async (req, reply) => {
    const admin = await app.prisma.insuranceAdmin.findUniqueOrThrow({
      where: { userId: req.user.userId },
    })
    const patients = await app.prisma.patient.findMany({
      where: { insuranceId: admin.insuranceId },
      include: { user: { select: { email: true } } },
    })
    return reply.send(patients)
  })

  app.get('/me/stats', {
    preHandler: [app.authorize(['INSURANCE_ADMIN'])],
  }, async (req, reply) => {
    const admin = await app.prisma.insuranceAdmin.findUniqueOrThrow({
      where: { userId: req.user.userId },
    })

    const [patientCount, totalBonus, recentAlerts] = await Promise.all([
      app.prisma.patient.count({ where: { insuranceId: admin.insuranceId } }),
      app.prisma.bonusPoint.aggregate({
        where: { insuranceId: admin.insuranceId },
        _sum: { points: true },
      }),
      app.prisma.alert.count({
        where: {
          patient: { insuranceId: admin.insuranceId },
          resolved: false,
        },
      }),
    ])

    return reply.send({
      patientCount,
      totalBonusAwarded: totalBonus._sum.points ?? 0,
      unresolvedAlerts: recentAlerts,
    })
  })

  app.post('/me/bonus', {
    preHandler: [app.authorize(['INSURANCE_ADMIN'])],
  }, async (req, reply) => {
    const admin = await app.prisma.insuranceAdmin.findUniqueOrThrow({
      where: { userId: req.user.userId },
    })
    const body = AwardBonusSchema.parse(req.body)

    const bonus = await app.prisma.bonusPoint.create({
      data: { ...body, insuranceId: admin.insuranceId },
    })
    return reply.status(201).send(bonus)
  })

  app.patch('/me/bonus-program', {
    preHandler: [app.authorize(['INSURANCE_ADMIN'])],
  }, async (req, reply) => {
    const admin = await app.prisma.insuranceAdmin.findUniqueOrThrow({
      where: { userId: req.user.userId },
    })
    const { bonusProgramActive } = req.body as { bonusProgramActive: boolean }
    const insurance = await app.prisma.insuranceCompany.update({
      where: { id: admin.insuranceId },
      data: { bonusProgramActive },
    })
    return reply.send(insurance)
  })
}
