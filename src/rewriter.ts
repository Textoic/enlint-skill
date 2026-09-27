import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";

export type Reply = { text: string; cost: number };

export type Rewriter = (brief: string) => Promise<Reply>;

const BINARIES = [
  ["claude.exe"],
  ["node_modules", "@anthropic-ai", "claude-code", "bin", "claude.exe"],
  ["claude"],
];

const pathFolders = () => (process.env.PATH ?? "").split(delimiter).filter((folder) => folder !== "");

export const claudeBinary = () =>
  process.env.ENLINT_CLAUDE ||
  BINARIES.flatMap((parts) => pathFolders().map((folder) => join(folder, ...parts))).find(existsSync) ||
  "claude";

const NO_TOOLS =
  "The brief arrives as the user message. You have no tools: your reply is the finished passage and nothing else, starting at its first character, with no note about what you changed or how many words you wrote.\n\n";

const DELIVERY = /Read the brief you were given\.[\s\S]*?\n\n/u;

const withoutFrontmatter = (text: string) => text.replace(/^---\n[\s\S]*?\n---\n/u, "");

export const rewriterPrompt = async () => {
  const agent = fileURLToPath(new URL("../agents/prose-rewriter.md", import.meta.url));
  const body = withoutFrontmatter((await readFile(agent, "utf8")).replace(/\r\n/gu, "\n"));
  return body.replace(DELIVERY, () => NO_TOOLS).trim();
};

const argsFor = (system: string) => [
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
  system,
];

const TIMEOUT_MS = 180_000;

const replyFrom = (stdout: string): Reply => {
  const parsed = JSON.parse(stdout) as { result?: unknown; is_error?: unknown; total_cost_usd?: unknown };
  if (parsed.is_error === true || typeof parsed.result !== "string") {
    throw new Error(`the rewriter failed: ${stdout.slice(0, 300)}`);
  }

  return { text: parsed.result, cost: Number(parsed.total_cost_usd) || 0 };
};

const run = (system: string, brief: string) =>
  new Promise<string>((done, fail) => {
    const child = spawn(claudeBinary(), argsFor(system), {
      env: { ...process.env, ENLINT_DISABLE: "1" },
      windowsHide: true,
      timeout: TIMEOUT_MS,
    });
    const chunks: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.on("error", fail);
    child.on("close", (code) =>
      code === 0 ? done(Buffer.concat(chunks).toString("utf8")) : fail(new Error(`the rewriter exited with ${code}`)),
    );
    child.stdin.end(brief, "utf8");
  });

export const claudeRewriter: Rewriter = async (brief) => replyFrom(await run(await rewriterPrompt(), brief));
