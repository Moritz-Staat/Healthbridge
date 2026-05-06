import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { emitAlert } from '../../websocket/alert.socket'

const CreateMetricSchema = z.object({
  metricType: z.enum(['BLOOD_GLUCOSE', 'HEART_RATE', 'STEPS', 'BLOOD_PRESSURE_SYSTOLIC',
    'BLOOD_PRESSURE_DIASTOLIC', 'OXYGEN_SATURATION', 'SLEEP_HOURS', 'BODY_WEIGHT']),
  value: z.number(),
  unit: z.string(),
  measuredAt: z.string().optional(),
  deviceId: z.string().optional(),
})

const THRESHOLDS: Record<string, { high?: number; low?: number }> = {
  BLOOD_GLUCOSE: { high: 180, low: 70 },
  HEART_RATE: { high: 150 },
  OXYGEN_SATURATION: { low: 90 },
}

export async function healthMetricsRouter(app: FastifyInstance) {
  app.get('/:patientId/metrics', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { patientId } = req.params as { patientId: string }
    const { type, from, to, limit } = req.query as any

    const metrics = await app.prisma.healthMetric.findMany({
      where: {
        patientId,
        ...(type && { metricType: type }),
        measuredAt: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        },
      },
      orderBy: { measuredAt: 'desc' },
      take: limit ? parseInt(limit) : 100,
    })
    return reply.send(metrics)
  })

  app.get('/:patientId/metrics/latest', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { patientId } = req.params as { patientId: string }
    const types = ['BLOOD_GLUCOSE', 'HEART_RATE', 'STEPS', 'OXYGEN_SATURATION', 'BODY_WEIGHT']

    const latest = await Promise.all(
      types.map(type =>
        app.prisma.healthMetric.findFirst({
          where: { patientId, metricType: type as any },
          orderBy: { measuredAt: 'desc' },
        })
      )
    )
    return reply.send(latest.filter(Boolean))
  })

  app.post('/:patientId/metrics', {
    preHandler: [app.authorize(['PATIENT', 'SYSTEM_ADMIN'])],
  }, async (req, reply) => {
    const { patientId } = req.params as { patientId: string }
    const body = CreateMetricSchema.parse(req.body)

    const metric = await app.prisma.healthMetric.create({
      data: {
        patientId,
        metricType: body.metricType,
        value: body.value,
        unit: body.unit,
        measuredAt: body.measuredAt ? new Date(body.measuredAt) : new Date(),
        deviceId: body.deviceId,
      },
    })

    // Threshold-Check
    const limits = THRESHOLDS[body.metricType]
    if (limits) {
      if (limits.high && body.value > limits.high) {
        const alert = await app.prisma.alert.create({
          data: {
            patientId,
            alertType: body.metricType === 'BLOOD_GLUCOSE' ? 'GLUCOSE_HIGH' : 'HEART_RATE_ANOMALY',
            severity: body.value > limits.high * 1.2 ? 'CRITICAL' : 'HIGH',
            message: `${body.metricType.replace(/_/g, ' ')}: ${body.value} ${body.unit} (erhöht)`,
          },
        })
        emitAlert(patientId, alert as any)
      }
      if (limits.low && body.value < limits.low) {
        const alert = await app.prisma.alert.create({
          data: {
            patientId,
            alertType: 'GLUCOSE_LOW',
            severity: 'CRITICAL',
            message: `${body.metricType.replace(/_/g, ' ')}: ${body.value} ${body.unit} (kritisch niedrig)`,
          },
        })
        emitAlert(patientId, alert as any)
      }
    }

    return reply.status(201).send(metric)
  })
}
