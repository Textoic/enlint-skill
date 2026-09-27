import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { workRoot } from "./pending.js";
import { markTurn } from "./turns.js";

export type PromptPayload = { session_id?: unknown; cwd?: unknown };

export type PromptOptions = { notes: boolean; turns: boolean };

const safeName = (session: string) => session.replace(/[^A-Za-z0-9_-]/gu, "_") || "unknown";

const notePath = (session: string) => join(workRoot(), "sessions", `${safeName(session)}.feedback.txt`);

const text = (value: unknown) => (typeof value === "string" ? value : "");

export const leaveNote = async (session: string, note: string) => {
  await mkdir(join(workRoot(), "sessions"), { recursive: true });
  await writeFile(notePath(session), note, "utf8");
};

const takeNote = async (session: string) => {
  try {
    const note = await readFile(notePath(session), "utf8");
    await rm(notePath(session), { force: true });
    return note;
  } catch {
    return "";
  }
};

export const atPrompt = async (payload: PromptPayload, options: PromptOptions = { notes: true, turns: true }) => {
  const session = text(payload.session_id);
  if (options.turns && text(payload.cwd) !== "") {
    await markTurn(session, text(payload.cwd));
  }

  const note = options.notes ? await takeNote(session) : "";
  return note === ""
    ? null
    : { hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: note } };
};
