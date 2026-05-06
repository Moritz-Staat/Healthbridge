import { FastifyInstance } from 'fastify'

export async function familyRouter(app: FastifyInstance) {
  // Gibt alle Patienten zurück, mit denen der eingeloggte FamilyMember verknüpft ist
  app.get('/my-patients', {
    preHandler: [app.authorize(['FAMILY_MEMBER'])],
  }, async (req, reply) => {
    const familyMembers = await app.prisma.familyMember.findMany({
      where: { userId: req.user.userId },
      include: {
        patient: {
          include: {
            insurance: true,
          },
        },
      },
    })
    return reply.send(familyMembers.map(fm => fm.patient))
  })

  // Übersichtsdaten für einen Patienten (nur für verknüpfte FamilyMembers)
  app.get('/patient/:patientId/overview', {
    preHandler: [app.authorize(['FAMILY_MEMBER'])],
  }, async (req, reply) => {
    const { patientId } = req.params as { patientId: string }

    // Access check
    const access = await app.prisma.familyMember.findFirst({
      where: { userId: req.user.userId, patientId },
    })
    if (!access) return reply.status(403).send({ error: 'No access' })

    const [latestMetrics, medications, alerts, appointments, bonusData] = await Promise.all([
      // Latest metric per type
      Promise.all(['BLOOD_GLUCOSE', 'HEART_RATE', 'STEPS', 'OXYGEN_SATURATION'].map(type =>
        app.prisma.healthMetric.findFirst({
          where: { patientId, metricType: type as any },
          orderBy: { measuredAt: 'desc' },
        })
      )),
      app.prisma.medication.findMany({
        where: { patientId, isActive: true },
        include: {
          logs: {
            where: { takenAt: { gte: new Date(new Date().setHours(0,0,0,0)) } },
            orderBy: { takenAt: 'desc' },
          },
        },
      }),
      app.prisma.alert.findMany({
        where: { patientId, resolved: false },
        orderBy: { triggeredAt: 'desc' },
        take: 10,
      }),
      app.prisma.appointment.findMany({
        where: { patientId, appointmentDate: { gte: new Date() }, completed: false },
        orderBy: { appointmentDate: 'asc' },
        take: 3,
      }),
      app.prisma.bonusPoint.aggregate({
        where: { patientId },
        _sum: { points: true },
      }),
    ])

    // Medication adherence last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000)
    const recentLogs = await app.prisma.medicationLog.findMany({
      where: {
        medication: { patientId },
        takenAt: { gte: sevenDaysAgo },
      },
    })
    const adherenceRate = recentLogs.length > 0
      ? Math.round((recentLogs.filter(l => l.confirmed).length / recentLogs.length) * 100)
      : null

    return reply.send({
      latestMetrics: latestMetrics.filter(Boolean),
      medications,
      alerts,
      appointments,
      bonusTotal: bonusData._sum.points ?? 0,
      adherenceRate,
    })
  })

  // Glucose-Verlauf letzter 14 Tage
  app.get('/patient/:patientId/glucose-history', {
    preHandler: [app.authorize(['FAMILY_MEMBER'])],
  }, async (req, reply) => {
    const { patientId } = req.params as { patientId: string }
    const access = await app.prisma.familyMember.findFirst({
      where: { userId: req.user.userId, patientId },
    })
    if (!access) return reply.status(403).send({ error: 'No access' })

    const metrics = await app.prisma.healthMetric.findMany({
      where: {
        patientId,
        metricType: 'BLOOD_GLUCOSE',
        measuredAt: { gte: new Date(Date.now() - 14 * 24 * 3600000) },
      },
      orderBy: { measuredAt: 'asc' },
    })
    return reply.send(metrics)
  })

  // Alerts für eine Family-Verbindung
  app.get('/patient/:patientId/alerts', {
    preHandler: [app.authorize(['FAMILY_MEMBER'])],
  }, async (req, reply) => {
    const { patientId } = req.params as { patientId: string }
    const access = await app.prisma.familyMember.findFirst({
      where: { userId: req.user.userId, patientId },
    })
    if (!access) return reply.status(403).send({ error: 'No access' })

    const alerts = await app.prisma.alert.findMany({
      where: { patientId },
      orderBy: { triggeredAt: 'desc' },
      take: 50,
    })
    return reply.send(alerts)
  })
}
