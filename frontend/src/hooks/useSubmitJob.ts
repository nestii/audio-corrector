import { useState, useCallback } from 'react'
import { submitJob } from '../services/api'
import { usePollJob } from './usePollJob'

export type SubmitStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

export function useSubmitJob() {
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { poll, cancel } = usePollJob()

  const submit = useCallback(
    async (email: string, audioFile: File) => {
      setError(null)
      setStatus('uploading')

      try {
        const jobId = await submitJob(email, audioFile)
        setStatus('processing')

        poll(
          jobId,
          (url) => {
            setAudioUrl(url)
            setStatus('done')
          },
          (err) => {
            setError(err)
            setStatus('error')
          }
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setStatus('error')
      }
    },
    [poll]
  )

  const reset = useCallback(() => {
    cancel()
    setStatus('idle')
    setAudioUrl(null)
    setError(null)
  }, [cancel])

  return { status, audioUrl, error, submit, reset }
}
