import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

export type SessionPayload = { transcript_path?: unknown };

export const CARD_MARKER = "# enlint:begin";

const text = (value: unknown) => (typeof value === "string" ? value : "");

export const isCodexSession = (payload: SessionPayload) => {
  const transcript = text(payload.transcript_path);
  return basename(transcript).startsWith("rollout-") || /[\\/]\.codex[\\/]/u.test(transcript);
};

const codexConfig = () => join(process.env.CODEX_HOME || join(homedir(), ".codex"), "config.toml");

const readable = async (path: string) => {
  try {
    return await readFile(path, "utf8");
  } catch {
    return "";
  }
};

const cardInConfig = async () => (await readable(codexConfig())).includes(CARD_MARKER);

const card = () => readable(fileURLToPath(new URL("../style/compact.md", import.meta.url)));

export const atSessionStart = async (payload: SessionPayload) => {
  if (!isCodexSession(payload) || (await cardInConfig())) {
    return null;
  }

  const style = (await card()).trim();
  return style === "" ? null : { hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: style } };
};
