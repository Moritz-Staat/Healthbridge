import { FastifyInstance } from 'fastify'

export async function alertsRouter(app: FastifyInstance) {
  app.get('/:patientId/alerts', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { patientId } = req.params as { patientId: string }
    const { resolved } = req.query as { resolved?: string }

    const alerts = await app.prisma.alert.findMany({
      where: {
        patientId,
        ...(resolved !== undefined && { resolved: resolved === 'true' }),
      },
      orderBy: { triggeredAt: 'desc' },
    })
    return reply.send(alerts)
  })

  app.patch('/alerts/:id/resolve', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const alert = await app.prisma.alert.update({
      where: { id },
      data: { resolved: true, resolvedAt: new Date() },
    })
    return reply.send(alert)
  })
}
