// Batch Processing Queue Service
export interface BatchJob {
  id: string;
  userId: string;
  conversationId: string;
  prompts: string[];
  status: "pending" | "processing" | "completed" | "failed";
  results: string[];
  createdAt: Date;
  completedAt?: Date;
}

const jobQueue: Map<string, BatchJob> = new Map();

export async function createBatchJob(
  userId: string,
  conversationId: string,
  prompts: string[]
): Promise<BatchJob> {
  const jobId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const job: BatchJob = {
    id: jobId,
    userId,
    conversationId,
    prompts,
    status: "pending",
    results: [],
    createdAt: new Date(),
  };

  jobQueue.set(jobId, job);
  processBatchJob(jobId);

  return job;
}

export async function processBatchJob(jobId: string): Promise<void> {
  const job = jobQueue.get(jobId);
  if (!job) return;

  job.status = "processing";

  try {
    const results: string[] = [];

    for (const prompt of job.prompts) {
      // Generate thumbnail for each prompt
      // This would call the image generation service
      results.push(`generated-${Date.now()}`);
    }

    job.results = results;
    job.status = "completed";
    job.completedAt = new Date();
  } catch (error) {
    job.status = "failed";
    job.completedAt = new Date();
  }

  jobQueue.set(jobId, job);
}

export function getBatchJob(jobId: string): BatchJob | undefined {
  return jobQueue.get(jobId);
}

export function getUserBatchJobs(userId: string): BatchJob[] {
  return Array.from(jobQueue.values()).filter((job) => job.userId === userId);
}

export function cancelBatchJob(jobId: string): boolean {
  const job = jobQueue.get(jobId);
  if (!job) return false;

  if (job.status === "pending" || job.status === "processing") {
    jobQueue.delete(jobId);
    return true;
  }

  return false;
}

export default {
  createBatchJob,
  processBatchJob,
  getBatchJob,
  getUserBatchJobs,
  cancelBatchJob,
};
