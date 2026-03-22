# MVP
A single-page application that allows users to upload spoken audio and submit
it together with their email address to a REST API backend. The backend
immediately returns a job ID and processes the audio asynchronously —
transcribing it via Whisper, correcting grammar via GPT-4o mini, and
regenerating it as speech via TTS. The frontend polls for job status every
3 seconds and renders the corrected audio when complete.

## Limitations
Everything is stored in memory for now. The pipeline language is
hardcoded to English. A file upload is used instead of in-browser recording.
I focused mainly on the Backend code and the pipeline.

## Flow
```mermaid
sequenceDiagram
  actor User
  participant React as React app
  participant API as Express API
  participant OAI as OpenAI

  User->>React: enters email + selects audio file
  User->>React: clicks submit

  React->>API: POST /api/jobs (multipart: audio + email)
  API-->>React: 202 Accepted { jobId, status: pending }

  Note over API,OAI: pipeline runs asynchronously

  API->>API: status → processing
  API->>OAI: toFile(buffer) + transcriptions.create (Whisper, lang: en)
  OAI-->>API: transcript text
  API->>OAI: chat.completions.create (GPT-4o mini, grammar fix)
  OAI-->>API: corrected text
  API->>OAI: audio.speech.create (TTS)
  OAI-->>API: mp3 audio
  API->>API: status → done, store audio buffer

  loop every 3 seconds
    React->>API: GET /api/jobs/:jobId
    API-->>React: { status: pending | processing | done }
  end

  React->>API: GET /api/audio/:jobId
  API-->>React: audio/mpeg buffer
  React->>User: renders <audio> element
```

# Target state

## Improvements
A couple of improvements below:

### Authentication
- Currently anyone who knows a jobID can access the audio
- Users need to type their email. Ideally user logs in and we have their email, so there's no need to extra proivide that.

### Async processing
Currently - promise based. Ideally we introduce a queue and worker for better scaling and durability.

### Notifications
Frontend currently polls GET job every 3 seconds generating unnecessary requests. 
Two ideas:
- SSE - server pushes a done event to the browser the moment the worker finishes to avoid polling
- Email - send an email when job completes

### Persistent storage
Currently everything is handled in memory (jobs, audio). Ideally we store the job in the database and both audios (original one and corrected) in an object storage like S3.

### OpenAI misuse 
Without rate limiting, a single user could submit hundreds of jobs and exhaust
the OpenAI API credits. We could add a per-use submission rate-limiting (counter in redis) to track that.

---

![Target state](assets/target%20state.png)
