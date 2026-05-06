// Server-side uses internal Docker URL, client-side uses public URL
const API = typeof window === 'undefined'
  ? (process.env.API_URL ?? 'http://localhost:4000')
  : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000')

async function request<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export const api = {
  // Auth
  me: (token: string) => request('/api/auth/me', token),

  // Patient
  getPatient: (token: string) => request('/api/patients/me', token),
  updatePatient: (token: string, data: any) =>
    request('/api/patients/me', token, { method: 'PATCH', body: JSON.stringify(data) }),

  // Metrics
  getMetrics: (token: string, patientId: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request(`/api/patients/${patientId}/metrics${qs}`, token)
  },
  getLatestMetrics: (token: string, patientId: string) =>
    request(`/api/patients/${patientId}/metrics/latest`, token),
  createMetric: (token: string, patientId: string, data: any) =>
    request(`/api/patients/${patientId}/metrics`, token, { method: 'POST', body: JSON.stringify(data) }),

  // Medications
  getMedications: (token: string, patientId: string) =>
    request(`/api/patients/${patientId}/medications?active=true`, token),
  createMedication: (token: string, patientId: string, data: any) =>
    request(`/api/patients/${patientId}/medications`, token, { method: 'POST', body: JSON.stringify(data) }),
  logTaken: (token: string, medicationId: string) =>
    request(`/api/patients/medications/${medicationId}/log/taken`, token, { method: 'POST' }),
  logSkipped: (token: string, medicationId: string, skippedReason?: string) =>
    request(`/api/patients/medications/${medicationId}/log/skipped`, token, {
      method: 'POST', body: JSON.stringify({ skippedReason }),
    }),

  // Alerts
  getAlerts: (token: string, patientId: string, resolved?: boolean) => {
    const qs = resolved !== undefined ? `?resolved=${resolved}` : ''
    return request(`/api/patients/${patientId}/alerts${qs}`, token)
  },
  resolveAlert: (token: string, alertId: string) =>
    request(`/api/patients/alerts/${alertId}/resolve`, token, { method: 'PATCH' }),

  // Family
  getFamily: (token: string, patientId: string) =>
    request(`/api/patients/${patientId}/family`, token),

  // Appointments
  getAppointments: (token: string, patientId: string) =>
    request(`/api/patients/${patientId}/appointments`, token),
  createAppointment: (token: string, patientId: string, data: any) =>
    request(`/api/patients/${patientId}/appointments`, token, { method: 'POST', body: JSON.stringify(data) }),

  // Bonus
  getBonus: (token: string, patientId: string) =>
    request(`/api/patients/${patientId}/bonus`, token),

  // Family
  getFamilyPatients: (token: string) => request('/api/family/my-patients', token),
  getFamilyPatientOverview: (token: string, patientId: string) =>
    request(`/api/family/patient/${patientId}/overview`, token),
  getFamilyGlucoseHistory: (token: string, patientId: string) =>
    request(`/api/family/patient/${patientId}/glucose-history`, token),
  getFamilyAlerts: (token: string, patientId: string) =>
    request(`/api/family/patient/${patientId}/alerts`, token),

  // Dispenser
  getDispenserStatus: (token: string, patientId: string) =>
    request(`/api/dispenser/patient/${patientId}/status`, token),
  simulateDispense: (token: string, patientId: string, medicationId: string) =>
    request(`/api/dispenser/patient/${patientId}/simulate-dispense`, token, {
      method: 'POST', body: JSON.stringify({ medicationId }),
    }),

  // Insurance
  getInsuranceMe: (token: string) => request('/api/insurance/me', token),
  getInsurancePatients: (token: string) => request('/api/insurance/me/patients', token),
  getInsuranceStats: (token: string) => request('/api/insurance/me/stats', token),
  awardBonus: (token: string, data: any) =>
    request('/api/insurance/me/bonus', token, { method: 'POST', body: JSON.stringify(data) }),
}
