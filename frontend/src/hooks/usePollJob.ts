import { useCallback, useRef } from 'react'
import { getJobStatus, toRelativeAudioUrl, type JobResponse } from '../services/api'

const POLL_INTERVAL_MS = 3000

export function usePollJob() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const poll = useCallback(
    (
      jobId: string,
      onDone: (audioUrl: string) => void,
      onError: (error: string) => void
    ) => {
      const run = async () => {
        try {
          const data: JobResponse = await getJobStatus(jobId)

          if (data.status === 'done' && data.audioUrl) {
            onDone(toRelativeAudioUrl(data.audioUrl))
            return
          }

          if (data.status === 'error') {
            onError(data.error ?? 'Processing failed')
            return
          }

          timeoutRef.current = setTimeout(() => run(), POLL_INTERVAL_MS)
        } catch (err) {
          onError(err instanceof Error ? err.message : 'Something went wrong')
        }
      }

      run()
    },
    []
  )

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  return { poll, cancel }
}
