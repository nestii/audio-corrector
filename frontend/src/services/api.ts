const API_BASE = '/api'

export type JobStatus = 'pending' | 'processing' | 'done' | 'error'

export interface JobResponse {
  status: JobStatus
  jobId?: string
  audioUrl?: string
  error?: string
}

export async function submitJob(email: string, audioFile: File): Promise<string> {
  const formData = new FormData()
  formData.append('email', email)
  formData.append('audio', audioFile)

  const res = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? `Upload failed: ${res.status}`)
  }

  const { jobId } = await res.json()
  return jobId
}

export async function getJobStatus(jobId: string): Promise<JobResponse> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error ?? `Request failed: ${res.status}`)
  }

  return data
}

export function toRelativeAudioUrl(fullUrl: string): string {
  return fullUrl.replace(/^https?:\/\/[^/]+/, '')
}
