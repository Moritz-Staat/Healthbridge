import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Insurance Company
  const insurance = await prisma.insuranceCompany.upsert({
    where: { contractNumber: 'AOK-2024-001' },
    update: {},
    create: {
      name: 'AOK Bayern',
      contractNumber: 'AOK-2024-001',
      bonusProgramActive: true,
    },
  })

  // Patient User
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
          dateOfBirth: new Date('1985-03-15'),
          phone: '+49 89 12345678',
          consentGiven: true,
          insuranceId: insurance.id,
        },
      },
    },
    include: { patient: true },
  })

  const patient = patientUser.patient!

  // Insurance Admin
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

  // System Admin
  await prisma.user.upsert({
    where: { email: 'admin@healthbridge.de' },
    update: {},
    create: {
      email: 'admin@healthbridge.de',
      passwordHash: await bcrypt.hash('password123', 12),
      role: 'SYSTEM_ADMIN',
    },
  })

  // Health Metrics
  const metrics = [
    { metricType: 'BLOOD_GLUCOSE', value: 95, unit: 'mg/dl', hoursAgo: 2 },
    { metricType: 'BLOOD_GLUCOSE', value: 185, unit: 'mg/dl', hoursAgo: 5 },
    { metricType: 'HEART_RATE', value: 72, unit: 'bpm', hoursAgo: 1 },
    { metricType: 'STEPS', value: 7842, unit: 'steps', hoursAgo: 0 },
    { metricType: 'OXYGEN_SATURATION', value: 98, unit: '%', hoursAgo: 3 },
    { metricType: 'BODY_WEIGHT', value: 78.5, unit: 'kg', hoursAgo: 24 },
  ]

  for (const m of metrics) {
    await prisma.healthMetric.create({
      data: {
        patientId: patient.id,
        metricType: m.metricType as any,
        value: m.value,
        unit: m.unit,
        measuredAt: new Date(Date.now() - m.hoursAgo * 3600000),
      },
    })
  }

  // Medications
  const metformin = await prisma.medication.create({
    data: {
      patientId: patient.id,
      name: 'Metformin 500mg',
      dosage: '500mg',
      frequency: 'TWICE_DAILY',
      startDate: new Date('2024-01-01'),
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
      startDate: new Date('2024-01-01'),
      isActive: true,
    },
  })

  // Medication Logs
  await prisma.medicationLog.create({
    data: { medicationId: metformin.id, confirmed: true, takenAt: new Date() },
  })
  await prisma.medicationLog.create({
    data: { medicationId: lisinopril.id, confirmed: false, skippedReason: 'Vergessen' },
  })

  // Family Member
  await prisma.familyMember.create({
    data: {
      patientId: patient.id,
      fullName: 'Anna Mustermann',
      relationship: 'Ehefrau',
      email: 'anna@family.de',
      notificationsEnabled: true,
    },
  })

  // Alerts
  await prisma.alert.createMany({
    data: [
      {
        patientId: patient.id,
        alertType: 'GLUCOSE_HIGH',
        severity: 'HIGH',
        message: 'Blutzucker erhöht: 185 mg/dl',
        resolved: false,
      },
      {
        patientId: patient.id,
        alertType: 'MEDICATION_MISSED',
        severity: 'MEDIUM',
        message: 'Lisinopril 10mg wurde nicht eingenommen: Vergessen',
        resolved: false,
      },
    ],
  })

  // Bonus Points
  await prisma.bonusPoint.createMany({
    data: [
      { patientId: patient.id, insuranceId: insurance.id, points: 10, reason: 'Metformin eingenommen', category: 'MEDICATION_ADHERENCE' },
      { patientId: patient.id, insuranceId: insurance.id, points: 5, reason: 'Tagesziel Schritte erreicht', category: 'ACTIVITY_GOAL' },
    ],
  })

  // Appointment
  await prisma.appointment.create({
    data: {
      patientId: patient.id,
      title: 'Diabetologe Kontrolle',
      appointmentDate: new Date(Date.now() + 7 * 24 * 3600000),
      doctorName: 'Dr. Schmidt',
      location: 'Praxis Schmidt, Musterstr. 1, München',
    },
  })

  console.log('✅ Seed complete!')
  console.log('Demo accounts:')
  console.log('  Patient:          patient@healthbridge.de / password123')
  console.log('  Insurance Admin:  admin@aok.de / password123')
  console.log('  System Admin:     admin@healthbridge.de / password123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
