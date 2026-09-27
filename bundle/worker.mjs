import {
  rewriterFor,
  runJob
} from "./chunk-7VIIDS2B.mjs";
import "./chunk-K7HZUS6O.mjs";
import "./chunk-7LWY23YD.mjs";

// src/worker.ts
import { readFile, rm } from "node:fs/promises";
var workOn = async (jobPath) => {
  const job = JSON.parse(await readFile(jobPath, "utf8"));
  await rm(jobPath, { force: true });
  return runJob(job, rewriterFor(job.harness));
};
export {
  workOn
};
