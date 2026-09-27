import {
  runJob
} from "./chunk-5IGITWPF.mjs";
import "./chunk-RU3IP2X6.mjs";
import "./chunk-7LWY23YD.mjs";

// src/worker.ts
import { readFile as readFile2, rm } from "node:fs/promises";

// src/rewriter.ts
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";
var BINARIES = [
  ["claude.exe"],
  ["node_modules", "@anthropic-ai", "claude-code", "bin", "claude.exe"],
  ["claude"]
];
var pathFolders = () => (process.env.PATH ?? "").split(delimiter).filter((folder) => folder !== "");
var claudeBinary = () => process.env.ENLINT_CLAUDE || BINARIES.flatMap((parts) => pathFolders().map((folder) => join(folder, ...parts))).find(existsSync) || "claude";
var NO_TOOLS = "The brief arrives as the user message. You have no tools: your reply is the finished passage and nothing else, starting at its first character, with no note about what you changed or how many words you wrote.\n\n";
var DELIVERY = /Read the brief you were given\.[\s\S]*?\n\n/u;
var withoutFrontmatter = (text) => text.replace(/^---\n[\s\S]*?\n---\n/u, "");
var rewriterPrompt = async () => {
  const agent = fileURLToPath(new URL("../agents/prose-rewriter.md", import.meta.url));
  const body = withoutFrontmatter((await readFile(agent, "utf8")).replace(/\r\n/gu, "\n"));
  return body.replace(DELIVERY, () => NO_TOOLS).trim();
};
var argsFor = (system) => [
  "-p",
  "--model",
  process.env.ENLINT_REWRITE_MODEL || "haiku",
  "--setting-sources",
  "",
  "--tools",
  "",
  "--no-session-persistence",
  "--settings",
  JSON.stringify({ alwaysThinkingEnabled: false }),
  "--output-format",
  "json",
  "--system-prompt",
  system
];
var TIMEOUT_MS = 18e4;
var replyFrom = (stdout) => {
  const parsed = JSON.parse(stdout);
  if (parsed.is_error === true || typeof parsed.result !== "string") {
    throw new Error(`the rewriter failed: ${stdout.slice(0, 300)}`);
  }
  return { text: parsed.result, cost: Number(parsed.total_cost_usd) || 0 };
};
var run = (system, brief) => new Promise((done, fail) => {
  const child = spawn(claudeBinary(), argsFor(system), {
    env: { ...process.env, ENLINT_DISABLE: "1" },
    windowsHide: true,
    timeout: TIMEOUT_MS
  });
  const chunks = [];
  child.stdout.on("data", (chunk) => chunks.push(chunk));
  child.on("error", fail);
  child.on(
    "close",
    (code) => code === 0 ? done(Buffer.concat(chunks).toString("utf8")) : fail(new Error(`the rewriter exited with ${code}`))
  );
  child.stdin.end(brief, "utf8");
});
var claudeRewriter = async (brief) => replyFrom(await run(await rewriterPrompt(), brief));

// src/worker.ts
var workOn = async (jobPath) => {
  const job = JSON.parse(await readFile2(jobPath, "utf8"));
  await rm(jobPath, { force: true });
  return runJob(job, claudeRewriter);
};
export {
  workOn
};
