export type JobStatus = 'pending' | 'processing' | 'done' | 'error';

export interface Job {
  jobId: string;
  email: string;
  status: JobStatus;
  audioBuffer?: Buffer;
  error?: string;
  createdAt: Date;
}

const jobs = new Map<string, Job>();

export const createJob = (jobId: string, email: string): Job => {
  const job: Job = {
    jobId,
    email,
    status: 'pending',
    createdAt: new Date(),
  };
  jobs.set(jobId, job);
  return job;
};

export const getJob = (jobId: string): Job | undefined => {
  return jobs.get(jobId);
};

export const updateJob = (jobId: string, updates: Partial<Job>): void => {
  const job = jobs.get(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);
  jobs.set(jobId, { ...job, ...updates });
};

export const clearJobs = (): void => {
  jobs.clear();
};
