import './App.css'
import { useSubmitJob } from './hooks/useSubmitJob'

function App() {
  const { status, audioUrl, error, submit } = useSubmitJob()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const audioInput = form.elements.namedItem('audio') as HTMLInputElement
    const audioFile = audioInput.files?.[0]

    if (!email || !audioFile) {
      return
    }

    submit(email, audioFile)
  }

  const isProcessing = status === 'uploading' || status === 'processing'

  return (
    <div className="app">
      <header className="header">
        <h1>Audio Corrector</h1>
        <p className="tagline">Upload your audio — we&apos;ll fix the grammar and return it.</p>
      </header>

      <main className="main">
        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              disabled={isProcessing}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="audio">Audio file</label>
            <input
              id="audio"
              name="audio"
              type="file"
              accept="audio/*"
              disabled={isProcessing}
              required
            />
          </div>

          {error && <p className="error">{error}</p>}

          <button
            type="submit"
            className="submit"
            disabled={isProcessing}
          >
            {status === 'uploading' && 'Uploading...'}
            {status === 'processing' && 'Processing...'}
            {(status === 'idle' || status === 'done' || status === 'error') && 'Submit'}
          </button>
        </form>

        <section className="result">
          <h2>Corrected audio</h2>
          {status === 'processing' && (
            <p className="status">Transcribing, correcting, and generating…</p>
          )}
          {status === 'done' && audioUrl && (
            <audio controls src={audioUrl} className="audio-player" />
          )}
          {(status === 'idle' || status === 'uploading') && (
            <p className="placeholder">Your corrected audio will appear here.</p>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
