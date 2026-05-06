import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import { createServer } from 'http'
import { authRouter } from './modules/auth/auth.router'
import { patientRouter } from './modules/patient/patient.router'
import { healthMetricsRouter } from './modules/health-metrics/health-metrics.router'
import { medicationsRouter } from './modules/medications/medications.router'
import { alertsRouter } from './modules/alerts/alerts.router'
import { insuranceRouter } from './modules/insurance/insurance.router'
import { familyRouter } from './modules/family/family.router'
import { dispenserRouter } from './modules/dispenser/dispenser.router'
import { initSocket } from './websocket/alert.socket'
import { startMedicationCheckJob } from './jobs/medication-check.job'
import prismaPlugin from './plugins/prisma'
import authPlugin from './plugins/auth'

const app = Fastify({ logger: true })

async function main() {
  await app.register(cors, {
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  })
  await app.register(cookie)
  await app.register(prismaPlugin)
  await app.register(authPlugin)

  // Routes
  await app.register(authRouter, { prefix: '/api/auth' })
  await app.register(patientRouter, { prefix: '/api/patients' })
  await app.register(healthMetricsRouter, { prefix: '/api/patients' })
  await app.register(medicationsRouter, { prefix: '/api/patients' })
  await app.register(alertsRouter, { prefix: '/api/patients' })
  await app.register(insuranceRouter, { prefix: '/api/insurance' })
  await app.register(familyRouter, { prefix: '/api/family' })
  await app.register(dispenserRouter, { prefix: '/api/dispenser' })

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  // WebSocket + HTTP Server
  const server = createServer(app.server)
  const io = initSocket(server)

  // Cron Jobs
  startMedicationCheckJob(app.prisma)

  const PORT = parseInt(process.env.PORT ?? '4000')
  await app.listen({ port: PORT, host: '0.0.0.0' })
  console.log(`API running on http://0.0.0.0:${PORT}`)
}

main().catch(console.error)
