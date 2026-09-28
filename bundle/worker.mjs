import {
  rewriterFor,
  runJob
} from "./chunk-A6VVZ4YY.mjs";
import "./chunk-F4274IVV.mjs";
import "./chunk-MJOE2BNT.mjs";
import "./chunk-R7POPVJR.mjs";

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
