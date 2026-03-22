import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createJob, getJob, clearJobs, updateJob } from './jobStore';

describe('JobStore', () => {
  beforeEach(() => {
    clearJobs();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a job', () => {
    const createdJob = createJob('1', 'test@example.com');
    expect(createdJob).toEqual(
      expect.objectContaining({ email: 'test@example.com', status: 'pending' })
    );
  });

  it('gets a job', () => {
    const jobId = '1';
    expect(getJob(jobId)).toBeUndefined();

    createJob('1', 'test@example.com');

    expect(getJob(jobId)).toEqual(
      expect.objectContaining({ email: 'test@example.com', status: 'pending' })
    );
  });

  it('updates a job', () => {
    const jobId = '1';
    createJob('1', 'test@example.com');
    expect(getJob(jobId)).toEqual(
      expect.objectContaining({ email: 'test@example.com', status: 'pending' })
    );

    updateJob(jobId, { email: 'updated@example.com', status: 'done' });

    expect(getJob(jobId)).toEqual(
      expect.objectContaining({ email: 'updated@example.com', status: 'done' })
    );
  });

  it('throws when updating a job that does not exist', () => {
    expect(() => updateJob('nonexistent', { status: 'done' })).toThrow(
      'Job nonexistent not found'
    );
  });
});
