export type UserRole = 'PATIENT' | 'FAMILY_MEMBER' | 'INSURANCE_ADMIN' | 'SYSTEM_ADMIN'

export type MetricType =
  | 'BLOOD_GLUCOSE'
  | 'HEART_RATE'
  | 'STEPS'
  | 'BLOOD_PRESSURE_SYSTOLIC'
  | 'BLOOD_PRESSURE_DIASTOLIC'
  | 'OXYGEN_SATURATION'
  | 'SLEEP_HOURS'
  | 'BODY_WEIGHT'

export type AlertType =
  | 'MEDICATION_MISSED'
  | 'GLUCOSE_HIGH'
  | 'GLUCOSE_LOW'
  | 'HEART_RATE_ANOMALY'
  | 'INACTIVITY_WARNING'
  | 'BONUS_ACHIEVED'

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type DeviceType = 'APPLE_WATCH' | 'FITBIT' | 'GARMIN' | 'CGM_SENSOR' | 'BLOOD_PRESSURE_CUFF' | 'SMART_SCALE'
export type BonusCategory = 'MEDICATION_ADHERENCE' | 'ACTIVITY_GOAL' | 'REGULAR_CHECK_IN' | 'HEALTH_IMPROVEMENT'
export type Frequency = 'ONCE_DAILY' | 'TWICE_DAILY' | 'THREE_TIMES_DAILY' | 'WEEKLY_ONCE' | 'AS_NEEDED'

export interface User {
  id: string
  email: string
  role: UserRole
  createdAt: string
}

export interface Patient {
  id: string
  userId: string
  fullName: string
  dateOfBirth: string
  phone?: string
  consentGiven: boolean
  insuranceId?: string
  createdAt: string
  updatedAt: string
}

export interface HealthMetric {
  id: string
  patientId: string
  deviceId?: string
  metricType: MetricType
  value: number
  unit: string
  measuredAt: string
  createdAt: string
}

export interface Medication {
  id: string
  patientId: string
  name: string
  dosage: string
  frequency: Frequency
  startDate: string
  endDate?: string
  notes?: string
  isActive: boolean
  createdAt: string
}

export interface MedicationLog {
  id: string
  medicationId: string
  takenAt: string
  confirmed: boolean
  skippedReason?: string
}

export interface Alert {
  id: string
  patientId: string
  alertType: AlertType
  severity: AlertSeverity
  message: string
  triggeredAt: string
  resolved: boolean
  resolvedAt?: string
}

export interface WearableDevice {
  id: string
  patientId: string
  deviceName: string
  deviceType: DeviceType
  serialNumber?: string
  connectedSince: string
  isActive: boolean
}

export interface BonusPoint {
  id: string
  patientId: string
  insuranceId: string
  points: number
  reason: string
  category: BonusCategory
  earnedAt: string
}

export interface Appointment {
  id: string
  patientId: string
  title: string
  appointmentDate: string
  doctorName?: string
  location?: string
  notes?: string
  completed: boolean
  createdAt: string
}

export interface InsuranceCompany {
  id: string
  name: string
  contractNumber: string
  bonusProgramActive: boolean
  createdAt: string
}

export const METRIC_UNITS: Record<MetricType, string> = {
  BLOOD_GLUCOSE: 'mg/dl',
  HEART_RATE: 'bpm',
  STEPS: 'steps',
  BLOOD_PRESSURE_SYSTOLIC: 'mmHg',
  BLOOD_PRESSURE_DIASTOLIC: 'mmHg',
  OXYGEN_SATURATION: '%',
  SLEEP_HOURS: 'h',
  BODY_WEIGHT: 'kg',
}

export const METRIC_LABELS: Record<MetricType, string> = {
  BLOOD_GLUCOSE: 'Blutzucker',
  HEART_RATE: 'Herzfrequenz',
  STEPS: 'Schritte',
  BLOOD_PRESSURE_SYSTOLIC: 'Blutdruck systolisch',
  BLOOD_PRESSURE_DIASTOLIC: 'Blutdruck diastolisch',
  OXYGEN_SATURATION: 'Sauerstoffsättigung',
  SLEEP_HOURS: 'Schlaf',
  BODY_WEIGHT: 'Körpergewicht',
}

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  MEDICATION_MISSED: 'Medikament vergessen',
  GLUCOSE_HIGH: 'Blutzucker erhöht',
  GLUCOSE_LOW: 'Blutzucker niedrig',
  HEART_RATE_ANOMALY: 'Herzfrequenz-Anomalie',
  INACTIVITY_WARNING: 'Inaktivitätswarnung',
  BONUS_ACHIEVED: 'Bonus erreicht',
}
