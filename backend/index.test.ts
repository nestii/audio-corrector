import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from './index';
import { createJob, updateJob, clearJobs } from './store/jobStore';

vi.mock('./services/pipeline', () => ({
  runPipeline: vi.fn(),
}));

describe("Job's progress", () => {
  beforeEach(() => {
    clearJobs();
  });

  it('returns pending, then processing, then done', async () => {
    const jobId = 'test-job-123';
    createJob(jobId, 'test@example.com');

    const res1 = await request(app).get(`/api/jobs/${jobId}`);
    expect(res1.status).toBe(200);
    expect(res1.body).toEqual({ status: 'pending' });

    updateJob(jobId, { status: 'processing' });

    const res2 = await request(app).get(`/api/jobs/${jobId}`);
    expect(res2.status).toBe(200);
    expect(res2.body).toEqual({ status: 'processing' });

    const audioBuffer = Buffer.from('fake-mp3-data');
    updateJob(jobId, { status: 'done', audioBuffer });

    const res3 = await request(app).get(`/api/jobs/${jobId}`);
    expect(res3.status).toBe(200);
    expect(res3.body.status).toBe('done');
    expect(res3.body.audioUrl).toContain(`/api/audio/${jobId}`);
  });

  it('returns error status with error message when pipeline fails', async () => {
    const jobId = 'test-job-123';
    createJob(jobId, 'test@example.com');

    updateJob(jobId, { status: 'error' });

    const res2 = await request(app).get(`/api/jobs/${jobId}`);
    expect(res2.status).toBe(200);
    expect(res2.body).toEqual({ status: 'error' });
  });
});
