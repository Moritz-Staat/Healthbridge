import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import { emitAlert } from '../websocket/alert.socket'
import { startOfDay } from 'date-fns'

export function startMedicationCheckJob(prisma: PrismaClient) {
  // Runs daily at 20:00
  cron.schedule('0 20 * * *', async () => {
    console.log('[Job] Running daily medication check...')
    const today = startOfDay(new Date())

    const activeMeds = await prisma.medication.findMany({
      where: { isActive: true, startDate: { lte: new Date() } },
      include: {
        logs: { where: { takenAt: { gte: today } } },
      },
    })

    for (const med of activeMeds) {
      if (med.logs.length === 0) {
        const alert = await prisma.alert.create({
          data: {
            patientId: med.patientId,
            alertType: 'MEDICATION_MISSED',
            severity: 'MEDIUM',
            message: `${med.name} wurde heute noch nicht eingenommen`,
          },
        })
        emitAlert(med.patientId, alert as any)
      }
    }

    console.log(`[Job] Checked ${activeMeds.length} medications`)
  })
}
