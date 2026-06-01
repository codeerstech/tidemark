import axios from 'axios'

export const LEAD_SUCCESS_MESSAGE = 'Details saved. We will reach you shortly.'
export const LEAD_ERROR_MESSAGE = 'We could not save your details right now. Please try again.'

export type LeadPayload = {
  niche: string
  project: string
  projectKey?: string
  formId?: string
  pagePath?: string
  pageUrl?: string
  referrer?: string
  name?: string
  email?: string
  phone?: string
  organization?: string
  interest?: string
  message?: string
  fields?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

const leadApi = axios.create({
  baseURL: 'https://dev.indemnisezmoi.fr/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function submitLead(payload: LeadPayload) {
  await leadApi.post('/lead', payload)
}
