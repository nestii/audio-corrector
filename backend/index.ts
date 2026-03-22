import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { createJob, getJob } from './store/jobStore';
import { runPipeline } from './services/pipeline';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(
  cors({
    origin: 'http://localhost:5173',
  })
);

app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

/**
 * Accepts audio file + email, creates a job, fires pipeline async.
 */
app.post('/api/jobs', upload.single('audio'), (req, res) => {
  const email = req.body.email;
  const audioBuffer = req.file?.buffer;
  const audioFilename = req.file?.originalname;
  const audioMimetype = req.file?.mimetype;

  if (!audioFilename || !audioMimetype) {
    res.status(400).json({ error: 'filename and mimetype are required' });
    return;
  }

  if (!email || !audioBuffer) {
    res.status(400).json({ error: 'email and audio are required' });
    return;
  }

  const jobId = randomUUID();
  createJob(jobId, email);

  runPipeline({ jobId, audioBuffer, audioFilename, audioMimetype }).catch(
    (err) => console.error(`[${jobId}] unhandled pipeline error:`, err)
  );

  console.log(`[${jobId}] job created, pipeline started`);
  res.status(202).json({ jobId });
});

/**
 * Returns job status.
 */
app.get('/api/jobs/:id', (req, res) => {
  const job = getJob(req.params.id);

  if (!job) {
    res.status(404).json({ error: 'job not found' });
    return;
  }

  if (job.status === 'done') {
    const baseUrl = process.env.API_BASE_URL ?? `http://localhost:${PORT}`;
    res.json({
      status: 'done',
      audioUrl: `${baseUrl}/api/audio/${job.jobId}`,
    });
    return;
  }

  if (job.status === 'error') {
    res.json({
      status: 'error',
      error: job.error,
    });
    return;
  }

  res.json({ status: job.status });
});

/**
 * Get the (corrected) audio.
 */
app.get('/api/audio/:id', (req, res) => {
  const jobId = req.params.id;
  const job = getJob(jobId);
  console.log(`[${jobId}] audio fetch — status: ${job?.status ?? 'not found'}`);

  if (!job) {
    res.status(404).json({ error: 'job not found' });
    return;
  }

  if (job.status === 'error') {
    res.status(500).json({ error: job.error ?? 'pipeline failed' });
    return;
  }

  if (job.status !== 'done' || !job.audioBuffer) {
    res.status(202).json({ status: job.status });
    return;
  }

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Length', job.audioBuffer.length);
  res.send(job.audioBuffer);
});

export { app };

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`backend running on http://localhost:${PORT}`);
  });
}
