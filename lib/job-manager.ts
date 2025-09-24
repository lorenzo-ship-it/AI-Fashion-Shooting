import PQueue from 'p-queue';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { prisma } from './prisma';
import { SYSTEM_PROMPT } from './prompts';
import { generateContent } from './gemini';
import { writeInlineImage, getUploadPath } from './storage';
import { JobStatus } from '@prisma/client';
import { v4 as uuid } from 'uuid';

export type ReferenceSource =
  | { kind: 'upload'; path: string; mimeType: string }
  | { kind: 'generation'; taskId: string; mimeType: string }
  | { kind: 'buffer'; buffer: Buffer; mimeType: string };

export type GenerationTask = {
  id: string;
  prompt: string;
  description: string;
  references: ReferenceSource[];
  outputName: string;
  garmentId?: string;
  variantId?: string;
  angle: string;
  view: string;
};

type JobRuntime = {
  queue: PQueue;
  tasks: GenerationTask[];
  results: Map<string, { path: string; relative: string }>;
};

const jobRuntimes = new Map<string, JobRuntime>();

const concurrency = Number.parseInt(process.env.JOB_CONCURRENCY ?? '1', 10);

const ensureRuntime = (jobId: string) => {
  let runtime = jobRuntimes.get(jobId);
  if (!runtime) {
    const queue = new PQueue({ concurrency, autoStart: false });
    runtime = { queue, tasks: [], results: new Map() };
    jobRuntimes.set(jobId, runtime);
  }
  return runtime;
};

const resolveReference = async (jobId: string, runtime: JobRuntime, ref: ReferenceSource) => {
  if (ref.kind === 'upload') {
    const buffer = await readFile(getUploadPath(ref.path));
    return { inlineData: { data: buffer.toString('base64'), mimeType: ref.mimeType } };
  }
  if (ref.kind === 'generation') {
    const result = runtime.results.get(ref.taskId);
    if (!result) {
      throw new Error(`Generation reference ${ref.taskId} missing for job ${jobId}`);
    }
    const buffer = await readFile(result.path);
    return { inlineData: { data: buffer.toString('base64'), mimeType: ref.mimeType } };
  }
  return { inlineData: { data: ref.buffer.toString('base64'), mimeType: ref.mimeType } };
};

const executeTask = async (jobId: string, runtime: JobRuntime, task: GenerationTask) => {
  const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }
  if (job.stopRequested) {
    throw new Error('STOP_REQUESTED');
  }

  const contents = [{ text: SYSTEM_PROMPT }, { text: task.prompt }];
  for (const ref of task.references) {
    contents.push(await resolveReference(jobId, runtime, ref));
  }

  let attempt = 0;
  while (attempt < 3) {
    try {
      const result = await generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents,
      });
      if (!result.base64Images.length) {
        throw new Error('No inline image returned');
      }
      const fileRelative = join('jobs', jobId, `${task.outputName}-${uuid()}.png`);
      const filePath = await writeInlineImage(fileRelative, result.base64Images[0]);

      runtime.results.set(task.id, { path: filePath, relative: fileRelative });

      await prisma.generation.create({
        data: {
          id: uuid(),
          jobId,
          garmentId: task.garmentId,
          variantId: task.variantId,
          angle: task.angle,
          view: task.view,
          filePath: fileRelative,
          promptId: task.id,
        },
      });

      await prisma.generationLog.create({
        data: {
          id: uuid(),
          jobId,
          message: `Generated ${task.description}`,
          payload: {
            prompt: task.prompt,
            references: result.referenceHashes,
            textOutputs: result.textOutputs,
          },
        },
      });

      return;
    } catch (error) {
      attempt += 1;
      if (attempt >= 3) {
        throw error;
      }
      await prisma.generationLog.create({
        data: {
          id: uuid(),
          jobId,
          message: `Retry ${attempt} for ${task.description}`,
          payload: { error: (error as Error).message },
        },
      });
    }
  }
};

export const scheduleJob = async (jobId: string, tasks: GenerationTask[]) => {
  const runtime = ensureRuntime(jobId);
  const job = await prisma.generationJob.findUniqueOrThrow({ where: { id: jobId } });
  runtime.tasks = tasks;
  runtime.queue.clear();
  runtime.results.clear();

  await prisma.generationJob.update({
    where: { id: jobId },
    data: { status: JobStatus.QUEUED, stopRequested: false },
  });

  await prisma.outfit.update({
    where: { id: job.outfitId },
    data: { status: 'GENERATING' },
  });

  runtime.queue.removeAllListeners('error');

  tasks.forEach((task, index) => {
    runtime.queue.add(async () => {
      await prisma.generationJob.update({
        where: { id: jobId },
        data: { status: JobStatus.RUNNING },
      });
      await executeTask(jobId, runtime, task);
      await prisma.generationLog.create({
        data: {
          id: uuid(),
          jobId,
          message: `Completed task ${index + 1}/${tasks.length}`,
        },
      });
      if (index + 1 === tasks.length) {
        await prisma.generationJob.update({
          where: { id: jobId },
          data: { status: JobStatus.COMPLETED },
        });
        await prisma.outfit.update({
          where: { id: job.outfitId },
          data: { status: 'COMPLETED' },
        });
      }
    });
  });

  runtime.queue.on('error', async (error) => {
    if ((error as Error).message === 'STOP_REQUESTED') {
      await prisma.generationJob.update({ where: { id: jobId }, data: { status: JobStatus.STOPPED } });
      return;
    }
    await prisma.generationJob.update({ where: { id: jobId }, data: { status: JobStatus.ERROR } });
    await prisma.outfit.update({ where: { id: job.outfitId }, data: { status: 'ERROR' } });
    await prisma.generationLog.create({
      data: {
        id: uuid(),
        jobId,
        message: 'Job failed',
        payload: { error: (error as Error).message },
      },
    });
  });

  runtime.queue.start();
};

export const stopJob = async (jobId: string) => {
  const runtime = jobRuntimes.get(jobId);
  if (!runtime) return;
  await prisma.generationJob.update({ where: { id: jobId }, data: { stopRequested: true } });
  runtime.queue.pause();
};

export const resumeJob = async (jobId: string) => {
  const runtime = jobRuntimes.get(jobId);
  if (!runtime) return;
  await prisma.generationJob.update({ where: { id: jobId }, data: { stopRequested: false, status: JobStatus.RUNNING } });
  runtime.queue.start();
};

export const getJobRuntime = (jobId: string) => jobRuntimes.get(jobId);
