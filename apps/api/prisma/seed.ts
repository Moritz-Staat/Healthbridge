import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { subDays, addDays, setHours, setMinutes, startOfDay } from 'date-fns'

const prisma = new PrismaClient()

function randBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function randInt(min: number, max: number): number {
  return Math.floor(randBetween(min, max + 1))
}

// Seeded random for reproducibility-ish, but we use Math.random for simplicity
function gaussianRand(): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

async function main() {
  console.log('Seeding database with 90-day realistic data...')

  // ── Insurance Company ─────────────────────────────────────────────────────
  const insurance = await prisma.insuranceCompany.upsert({
    where: { contractNumber: 'AOK-2024-001' },
    update: {},
    create: {
      name: 'AOK Bayern',
      contractNumber: 'AOK-2024-001',
      bonusProgramActive: true,
    },
  })

  // ── Patient User ──────────────────────────────────────────────────────────
  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@healthbridge.de' },
    update: {},
    create: {
      email: 'patient@healthbridge.de',
      passwordHash: await bcrypt.hash('password123', 12),
      role: 'PATIENT',
      patient: {
        create: {
          fullName: 'Max Mustermann',
          dateOfBirth: new Date('1975-03-15'),
          phone: '+49 89 12345678',
          consentGiven: true,
          insuranceId: insurance.id,
        },
      },
    },
    include: { patient: true },
  })
  const patient = patientUser.patient!

  // ── Insurance Admin ───────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'admin@aok.de' },
    update: {},
    create: {
      email: 'admin@aok.de',
      passwordHash: await bcrypt.hash('password123', 12),
      role: 'INSURANCE_ADMIN',
      insuranceAdmin: {
        create: { insuranceId: insurance.id },
      },
    },
  })

  // ── System Admin ──────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'admin@healthbridge.de' },
    update: {},
    create: {
      email: 'admin@healthbridge.de',
      passwordHash: await bcrypt.hash('password123', 12),
      role: 'SYSTEM_ADMIN',
    },
  })

  // ── Clean up existing metrics/logs for this patient ───────────────────────
  await prisma.alert.deleteMany({ where: { patientId: patient.id } })
  await prisma.bonusPoint.deleteMany({ where: { patientId: patient.id } })
  await prisma.appointment.deleteMany({ where: { patientId: patient.id } })
  await prisma.healthMetric.deleteMany({ where: { patientId: patient.id } })

  // Delete medication logs first, then medications
  const existingMeds = await prisma.medication.findMany({ where: { patientId: patient.id } })
  for (const med of existingMeds) {
    await prisma.medicationLog.deleteMany({ where: { medicationId: med.id } })
  }
  await prisma.medication.deleteMany({ where: { patientId: patient.id } })

  const today = startOfDay(new Date())
  const DAYS = 90

  // ── Medications ───────────────────────────────────────────────────────────
  const metformin = await prisma.medication.create({
    data: {
      patientId: patient.id,
      name: 'Metformin 500mg',
      dosage: '500mg',
      frequency: 'TWICE_DAILY',
      startDate: subDays(today, DAYS),
      notes: 'Mit dem Essen einnehmen',
      isActive: true,
    },
  })

  const lisinopril = await prisma.medication.create({
    data: {
      patientId: patient.id,
      name: 'Lisinopril 10mg',
      dosage: '10mg',
      frequency: 'ONCE_DAILY',
      startDate: subDays(today, DAYS),
      isActive: true,
    },
  })

  // ── 90-day data generation ─────────────────────────────────────────────────
  const skippedReasons = ['Vergessen', 'Unterwegs', 'Nebenwirkungen', 'Vergessen', 'Vergessen']

  const healthMetricsData: Array<{
    patientId: string
    metricType: any
    value: number
    unit: string
    measuredAt: Date
  }> = []

  const medicationLogsData: Array<{
    medicationId: string
    takenAt: Date
    confirmed: boolean
    skippedReason?: string
  }> = []

  // Weight: start 88.5kg, trend down to ~85.2kg over 90 days
  const weightReadings: Array<{ day: number; value: number }> = []

  for (let d = DAYS; d >= 0; d--) {
    const date = subDays(today, d)
    const dayOfWeek = date.getDay() // 0=Sun, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isWeekday = !isWeekend
    // progress 0..1 (0=day 90 ago, 1=today)
    const progress = (DAYS - d) / DAYS

    // ── Blood Glucose: 3x per day ────────────────────────────────────────
    // Fasting (morning): 90-140, improving over time
    const fastingBase = 128 - progress * 18 // 128 -> 110
    const fastingVal = clamp(fastingBase + gaussianRand() * 12, 62, 195)

    // Occasional high spike (5% chance)
    const fastingFinal = Math.random() < 0.05 ? clamp(fastingVal + randBetween(50, 100), 180, 240) :
                         Math.random() < 0.03 ? clamp(fastingVal - randBetween(20, 40), 62, 85) :
                         fastingVal

    healthMetricsData.push({
      patientId: patient.id,
      metricType: 'BLOOD_GLUCOSE',
      value: Math.round(fastingFinal),
      unit: 'mg/dl',
      measuredAt: setMinutes(setHours(date, 7), randInt(0, 30)),
    })

    // Postprandial (2h after breakfast): 130-210
    const postBase = 175 - progress * 25 // 175 -> 150
    const postVal = clamp(postBase + gaussianRand() * 20, 100, 260)
    const postFinal = Math.random() < 0.04 ? clamp(postVal + randBetween(30, 65), 190, 240) : postVal

    healthMetricsData.push({
      patientId: patient.id,
      metricType: 'BLOOD_GLUCOSE',
      value: Math.round(postFinal),
      unit: 'mg/dl',
      measuredAt: setMinutes(setHours(date, 10), randInt(0, 30)),
    })

    // Evening: 100-160
    const eveningBase = 148 - progress * 20 // 148 -> 128
    const eveningVal = clamp(eveningBase + gaussianRand() * 15, 80, 200)

    healthMetricsData.push({
      patientId: patient.id,
      metricType: 'BLOOD_GLUCOSE',
      value: Math.round(eveningVal),
      unit: 'mg/dl',
      measuredAt: setMinutes(setHours(date, 20), randInt(0, 30)),
    })

    // ── Heart Rate: 1x per day ────────────────────────────────────────────
    const hrBase = isWeekday ? randBetween(68, 82) : randBetween(60, 76)
    const hrVal = clamp(hrBase + gaussianRand() * 4, 52, 98)
    healthMetricsData.push({
      patientId: patient.id,
      metricType: 'HEART_RATE',
      value: Math.round(hrVal),
      unit: 'bpm',
      measuredAt: setMinutes(setHours(date, 8), randInt(0, 45)),
    })

    // ── Steps: 1x per day ─────────────────────────────────────────────────
    let stepsBase = isWeekend ? randBetween(6000, 11000) : randBetween(4000, 9500)
    // Occasional very low day (<2000)
    if (Math.random() < 0.06) stepsBase = randBetween(800, 2000)
    // Occasional excellent day
    if (Math.random() < 0.08) stepsBase = randBetween(10000, 14000)
    const stepsVal = clamp(stepsBase + gaussianRand() * 500, 500, 15000)
    healthMetricsData.push({
      patientId: patient.id,
      metricType: 'STEPS',
      value: Math.round(stepsVal),
      unit: 'steps',
      measuredAt: setMinutes(setHours(date, 23), 0),
    })

    // ── Sleep: 1x per day ─────────────────────────────────────────────────
    const sleepBase = isWeekend ? randBetween(6.5, 8.5) : randBetween(5.5, 7.5)
    const sleepVal = clamp(sleepBase + gaussianRand() * 0.4, 4.5, 9.5)
    healthMetricsData.push({
      patientId: patient.id,
      metricType: 'SLEEP_HOURS',
      value: Math.round(sleepVal * 10) / 10,
      unit: 'h',
      measuredAt: setMinutes(setHours(date, 6), 30),
    })

    // ── Oxygen Saturation: 1x per day ─────────────────────────────────────
    const spo2Val = clamp(97 + gaussianRand() * 1, 95, 99)
    healthMetricsData.push({
      patientId: patient.id,
      metricType: 'OXYGEN_SATURATION',
      value: Math.round(spo2Val * 10) / 10,
      unit: '%',
      measuredAt: setMinutes(setHours(date, 7), 15),
    })

    // ── Body Weight: weekly ───────────────────────────────────────────────
    if (d % 7 === 0 || d === DAYS) {
      const weightProgress = (DAYS - d) / DAYS
      const weightBase = 88.5 - weightProgress * 3.3 // 88.5 -> 85.2
      const weightVal = clamp(weightBase + gaussianRand() * 0.3, 84.0, 90.0)
      weightReadings.push({ day: d, value: Math.round(weightVal * 10) / 10 })
      healthMetricsData.push({
        patientId: patient.id,
        metricType: 'BODY_WEIGHT',
        value: Math.round(weightVal * 10) / 10,
        unit: 'kg',
        measuredAt: setMinutes(setHours(date, 7), 0),
      })
    }

    // ── Medication Logs ───────────────────────────────────────────────────
    // Metformin 2x daily (morning + evening), ~85% adherence each
    for (const hour of [8, 20]) {
      const taken = Math.random() < 0.85
      medicationLogsData.push({
        medicationId: metformin.id,
        takenAt: setMinutes(setHours(date, hour), randInt(0, 20)),
        confirmed: taken,
        skippedReason: taken ? undefined : skippedReasons[randInt(0, skippedReasons.length - 1)],
      })
    }

    // Lisinopril 1x daily (morning), ~87% adherence
    const lisinTaken = Math.random() < 0.87
    medicationLogsData.push({
      medicationId: lisinopril.id,
      takenAt: setMinutes(setHours(date, 8), randInt(0, 15)),
      confirmed: lisinTaken,
      skippedReason: lisinTaken ? undefined : skippedReasons[randInt(0, skippedReasons.length - 1)],
    })
  }

  // Bulk insert health metrics in batches
  console.log(`Inserting ${healthMetricsData.length} health metrics...`)
  const BATCH = 200
  for (let i = 0; i < healthMetricsData.length; i += BATCH) {
    await prisma.healthMetric.createMany({ data: healthMetricsData.slice(i, i + BATCH) })
  }

  // Bulk insert medication logs
  console.log(`Inserting ${medicationLogsData.length} medication logs...`)
  for (let i = 0; i < medicationLogsData.length; i += BATCH) {
    await prisma.medicationLog.createMany({ data: medicationLogsData.slice(i, i + BATCH) })
  }

  // ── Alerts: ~15 spread over 90 days ──────────────────────────────────────
  const alertDays = [88, 82, 76, 70, 65, 58, 52, 45, 38, 31, 24, 17, 10, 5, 1]
  const alertDefs = [
    { alertType: 'GLUCOSE_HIGH', severity: 'HIGH', message: 'Blutzucker erhöht: 218 mg/dl — Bitte messen und ggf. Arzt kontaktieren' },
    { alertType: 'GLUCOSE_HIGH', severity: 'CRITICAL', message: 'Kritisch erhöhter Blutzucker: 237 mg/dl' },
    { alertType: 'GLUCOSE_LOW', severity: 'CRITICAL', message: 'Unterzuckerung: 64 mg/dl — Sofort Traubenzucker einnehmen!' },
    { alertType: 'MEDICATION_MISSED', severity: 'MEDIUM', message: 'Metformin 500mg morgens nicht eingenommen (Vergessen)' },
    { alertType: 'MEDICATION_MISSED', severity: 'MEDIUM', message: 'Lisinopril 10mg nicht eingenommen (Unterwegs)' },
    { alertType: 'GLUCOSE_HIGH', severity: 'HIGH', message: 'Blutzucker nach dem Essen: 205 mg/dl' },
    { alertType: 'INACTIVITY_WARNING', severity: 'LOW', message: 'Weniger als 2000 Schritte heute — mehr Bewegung empfohlen' },
    { alertType: 'MEDICATION_MISSED', severity: 'MEDIUM', message: 'Metformin 500mg abends nicht eingenommen (Nebenwirkungen)' },
    { alertType: 'GLUCOSE_HIGH', severity: 'HIGH', message: 'Nüchternblutzucker erhöht: 192 mg/dl' },
    { alertType: 'GLUCOSE_LOW', severity: 'HIGH', message: 'Niedriger Blutzucker: 69 mg/dl' },
    { alertType: 'MEDICATION_MISSED', severity: 'MEDIUM', message: 'Lisinopril 10mg nicht eingenommen (Vergessen)' },
    { alertType: 'INACTIVITY_WARNING', severity: 'LOW', message: 'Nur 1200 Schritte heute' },
    { alertType: 'GLUCOSE_HIGH', severity: 'HIGH', message: 'Postprandialer Blutzucker: 226 mg/dl' },
    { alertType: 'MEDICATION_MISSED', severity: 'MEDIUM', message: 'Metformin 500mg morgens vergessen' },
    { alertType: 'GLUCOSE_HIGH', severity: 'MEDIUM', message: 'Abend-Blutzucker leicht erhöht: 184 mg/dl' },
  ]

  for (let i = 0; i < alertDays.length; i++) {
    const day = alertDays[i]
    const def = alertDefs[i % alertDefs.length]
    const triggeredAt = setHours(subDays(today, day), randInt(8, 20))
    const resolved = i < 10 // first 10 resolved
    await prisma.alert.create({
      data: {
        patientId: patient.id,
        alertType: def.alertType as any,
        severity: def.severity as any,
        message: def.message,
        triggeredAt,
        resolved,
        resolvedAt: resolved ? addDays(triggeredAt, randInt(0, 2)) : null,
      },
    })
  }

  // ── Bonus Points: ~20 entries ─────────────────────────────────────────────
  const bonusDefs = [
    { points: 10, reason: 'Metformin 7 Tage in Folge eingenommen', category: 'MEDICATION_ADHERENCE' },
    { points: 5, reason: 'Tagesziel 8000 Schritte erreicht', category: 'ACTIVITY_GOAL' },
    { points: 10, reason: 'Lisinopril 7 Tage in Folge eingenommen', category: 'MEDICATION_ADHERENCE' },
    { points: 15, reason: 'Wochenziel Aktivität erreicht (>50.000 Schritte)', category: 'ACTIVITY_GOAL' },
    { points: 5, reason: 'Regelmäßige Blutzucker-Messung (7 Tage)', category: 'REGULAR_CHECK_IN' },
    { points: 20, reason: 'Blutzucker-Durchschnitt verbessert', category: 'HEALTH_IMPROVEMENT' },
    { points: 5, reason: 'Tagesziel Schritte erreicht', category: 'ACTIVITY_GOAL' },
    { points: 10, reason: 'Medikamenteneinnahme komplett (30 Tage)', category: 'MEDICATION_ADHERENCE' },
    { points: 5, reason: 'Schlafziel erreicht (≥7h, 5 Tage)', category: 'REGULAR_CHECK_IN' },
    { points: 10, reason: 'Gewichtsreduktion 0.5kg erreicht', category: 'HEALTH_IMPROVEMENT' },
    { points: 5, reason: 'Tagesziel Schritte erreicht', category: 'ACTIVITY_GOAL' },
    { points: 5, reason: 'Blutzucker im Zielbereich (ganzer Tag)', category: 'HEALTH_IMPROVEMENT' },
    { points: 10, reason: 'Metformin 30 Tage ohne Lücke', category: 'MEDICATION_ADHERENCE' },
    { points: 15, reason: 'HbA1c-Verbesserung dokumentiert', category: 'HEALTH_IMPROVEMENT' },
    { points: 5, reason: 'Tagesziel Schritte erreicht', category: 'ACTIVITY_GOAL' },
    { points: 5, reason: 'Regelmäßiges Wiegen (4 Wochen)', category: 'REGULAR_CHECK_IN' },
    { points: 10, reason: 'Wochenziel Aktivität erreicht', category: 'ACTIVITY_GOAL' },
    { points: 5, reason: 'Blutzucker-Check-in komplett', category: 'REGULAR_CHECK_IN' },
    { points: 20, reason: 'Gewicht -1kg Meilenstein', category: 'HEALTH_IMPROVEMENT' },
    { points: 5, reason: 'Tagesziel Schritte erreicht', category: 'ACTIVITY_GOAL' },
  ]

  for (let i = 0; i < bonusDefs.length; i++) {
    const def = bonusDefs[i]
    const daysAgo = Math.floor((DAYS - 1) * (i / (bonusDefs.length - 1)))
    await prisma.bonusPoint.create({
      data: {
        patientId: patient.id,
        insuranceId: insurance.id,
        points: def.points,
        reason: def.reason,
        category: def.category as any,
        earnedAt: subDays(today, daysAgo),
      },
    })
  }

  // ── Appointments ──────────────────────────────────────────────────────────
  await prisma.appointment.createMany({
    data: [
      {
        patientId: patient.id,
        title: 'Diabetologe Quartalskontrolle',
        appointmentDate: subDays(today, 75),
        doctorName: 'Dr. Michael Berger',
        location: 'Diabeteszentrum München, Leopoldstr. 12',
        notes: 'HbA1c, Nierenwerte, Augendruckkontrolle besprechen',
        completed: true,
      },
      {
        patientId: patient.id,
        title: 'Hausarzt Blutdruck-Check',
        appointmentDate: subDays(today, 42),
        doctorName: 'Dr. Sandra Müller',
        location: 'Hausarztpraxis Müller, Bahnhofstr. 5, München',
        notes: 'Blutdruck und Medikamentenanpassung',
        completed: true,
      },
      {
        patientId: patient.id,
        title: 'Ophthalmologe — Diabetische Retinopathie Screening',
        appointmentDate: subDays(today, 14),
        doctorName: 'Dr. Klaus Fischer',
        location: 'Augenzentrum Fischer, Maximilianstr. 88, München',
        completed: true,
      },
      {
        patientId: patient.id,
        title: 'Diabetologe Folgetermin',
        appointmentDate: addDays(today, 18),
        doctorName: 'Dr. Michael Berger',
        location: 'Diabeteszentrum München, Leopoldstr. 12',
        notes: 'Therapieanpassung besprechen, Laborwerte',
        completed: false,
      },
      {
        patientId: patient.id,
        title: 'Ernährungsberatung',
        appointmentDate: addDays(today, 35),
        doctorName: 'Diätassistentin Eva Bauer',
        location: 'AOK Gesundheitszentrum, Schillerstr. 3, München',
        notes: 'Kohlenhydratzählen, glykämischer Index',
        completed: false,
      },
    ],
  })

  // ── Family Member ─────────────────────────────────────────────────────────
  const existingFamily = await prisma.familyMember.findMany({ where: { patientId: patient.id } })
  if (existingFamily.length === 0) {
    await prisma.familyMember.create({
      data: {
        patientId: patient.id,
        fullName: 'Anna Mustermann',
        relationship: 'Ehefrau',
        email: 'anna@family.de',
        notificationsEnabled: true,
      },
    })
  }

  console.log('Seed complete!')
  console.log('Demo accounts:')
  console.log('  Patient:          patient@healthbridge.de / password123')
  console.log('  Insurance Admin:  admin@aok.de / password123')
  console.log('  System Admin:     admin@healthbridge.de / password123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
