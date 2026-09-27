import "./chunk-R7POPVJR.mjs";

// src/session.ts
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
var CARD_MARKER = "# enlint:begin";
var text = (value) => typeof value === "string" ? value : "";
var isCodexSession = (payload) => {
  const transcript = text(payload.transcript_path);
  return basename(transcript).startsWith("rollout-") || /[\\/]\.codex[\\/]/u.test(transcript);
};
var codexConfig = () => join(process.env.CODEX_HOME || join(homedir(), ".codex"), "config.toml");
var readable = async (path) => {
  try {
    return await readFile(path, "utf8");
  } catch {
    return "";
  }
};
var cardInConfig = async () => (await readable(codexConfig())).includes(CARD_MARKER);
var card = () => readable(fileURLToPath(new URL("../style/compact.md", import.meta.url)));
var atSessionStart = async (payload) => {
  if (!isCodexSession(payload) || await cardInConfig()) {
    return null;
  }
  const style = (await card()).trim();
  return style === "" ? null : { hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: style } };
};
export {
  CARD_MARKER,
  atSessionStart,
  isCodexSession
};
