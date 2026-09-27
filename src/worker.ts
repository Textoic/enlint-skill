import { readFile, rm } from "node:fs/promises";
import { runJob, type Job } from "./background.js";
import { rewriterFor } from "./rewriter.js";

export const workOn = async (jobPath: string) => {
  const job = JSON.parse(await readFile(jobPath, "utf8")) as Job;
  await rm(jobPath, { force: true });
  return runJob(job, rewriterFor(job.harness));
};
