import { spawn } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";

export type Reply = { text: string; cost: number };

export type Rewriter = (brief: string) => Promise<Reply>;

export type Harness = "claude" | "codex";

const pathFolders = () => (process.env.PATH ?? "").split(delimiter).filter((folder) => folder !== "");

const onPath = (candidates: string[][]) =>
  candidates.flatMap((parts) => pathFolders().map((folder) => join(folder, ...parts))).find(existsSync);

export const claudeBinary = () =>
  process.env.ENLINT_CLAUDE ||
  onPath([["claude.exe"], ["node_modules", "@anthropic-ai", "claude-code", "bin", "claude.exe"], ["claude"]]) ||
  "claude";

const newestIn = (folder: string, name: string) => {
  try {
    return readdirSync(folder)
      .map((entry) => join(folder, entry, name))
      .filter(existsSync)
      .sort((one, other) => statSync(other).mtimeMs - statSync(one).mtimeMs)[0];
  } catch {
    return undefined;
  }
};

const desktopCodex = () =>
  process.env.LOCALAPPDATA == null ? undefined : newestIn(join(process.env.LOCALAPPDATA, "OpenAI", "Codex", "bin"), "codex.exe");

export const codexBinary = () =>
  process.env.ENLINT_CODEX || process.env.CODEX_CLI_PATH || onPath([["codex.exe"], ["codex"]]) || desktopCodex() || "codex";

const NO_TOOLS =
  "The brief arrives as the user message. You have no tools: your reply is the finished passage and nothing else, starting at its first character, with no note about what you changed or how many words you wrote.\n\n";

const DELIVERY = /Read the brief you were given\.[\s\S]*?\n\n/u;

const withoutFrontmatter = (text: string) => text.replace(/^---\n[\s\S]*?\n---\n/u, "");

export const rewriterPrompt = async () => {
  const agent = fileURLToPath(new URL("../agents/prose-rewriter.md", import.meta.url));
  const body = withoutFrontmatter((await readFile(agent, "utf8")).replace(/\r\n/gu, "\n"));
  return body.replace(DELIVERY, () => NO_TOOLS).trim();
};

const TIMEOUT_MS = 180_000;

const run = (binary: string, args: string[], input: string) =>
  new Promise<string>((done, fail) => {
    const child = spawn(binary, args, {
      env: { ...process.env, ENLINT_DISABLE: "1" },
      windowsHide: true,
      timeout: TIMEOUT_MS,
    });
    const chunks: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.stderr.resume();
    child.on("error", fail);
    child.on("close", (code) =>
      code === 0 ? done(Buffer.concat(chunks).toString("utf8")) : fail(new Error(`the rewriter exited with ${code}`)),
    );
    child.stdin.end(input, "utf8");
  });

const claudeArgs = (system: string) => [
  "-p",
  "--model",
  process.env.ENLINT_CLAUDE_MODEL || process.env.ENLINT_REWRITE_MODEL || "haiku",
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

const claudeReply = (stdout: string): Reply => {
  const parsed = JSON.parse(stdout) as { result?: unknown; is_error?: unknown; total_cost_usd?: unknown };
  if (parsed.is_error === true || typeof parsed.result !== "string") {
    throw new Error(`the rewriter failed: ${stdout.slice(0, 300)}`);
  }

  return { text: parsed.result, cost: Number(parsed.total_cost_usd) || 0 };
};

export const claudeRewriter: Rewriter = async (brief) =>
  claudeReply(await run(claudeBinary(), claudeArgs(await rewriterPrompt()), brief));

const codexArgs = (system: string, folder: string, out: string) => [
  "exec",
  "--ephemeral",
  "--ignore-user-config",
  "--skip-git-repo-check",
  "-s",
  "read-only",
  "-C",
  folder,
  "-m",
  process.env.ENLINT_CODEX_MODEL || "gpt-6-luna",
  "-c",
  'model_reasoning_effort="low"',
  "-c",
  `developer_instructions=${JSON.stringify(system)}`,
  "-o",
  out,
  "-",
];

export const codexRewriter: Rewriter = async (brief) => {
  const folder = await mkdtemp(join(tmpdir(), "enlint-codex-"));
  const out = join(folder, "reply.md");
  try {
    await run(codexBinary(), codexArgs(await rewriterPrompt(), folder, out), brief);
    return { text: await readFile(out, "utf8"), cost: 0 };
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
};

const REWRITERS: Record<Harness, Rewriter> = { claude: claudeRewriter, codex: codexRewriter };

export const rewriterFor = (harness: Harness | undefined): Rewriter => REWRITERS[harness ?? "claude"] ?? claudeRewriter;
