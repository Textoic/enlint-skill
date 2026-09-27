import { appendFile, mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type Event =
  | { kind: "wrote"; path: string }
  | { kind: "edited"; path: string; text: string };

export type Pending = {
  wrote: string[];
  edited: Map<string, string[]>;
};

export const workRoot = () => join(tmpdir(), "enlint");

const safeName = (session: string) =>
  session.replace(/[^A-Za-z0-9_-]/gu, "_") || "unknown";

export const logPath = (session: string) =>
  join(workRoot(), "sessions", `${safeName(session)}.jsonl`);

const parsedEvent = (line: string): Event[] => {
  try {
    return [JSON.parse(line) as Event];
  } catch {
    return [];
  }
};

const eventsIn = (raw: string): Event[] =>
  raw
    .split("\n")
    .filter((line) => line.trim() !== "")
    .flatMap(parsedEvent);

const readLog = async (session: string) => {
  try {
    return await readFile(logPath(session), "utf8");
  } catch {
    return "";
  }
};

const withEdit = (edited: Map<string, string[]>, path: string, text: string) =>
  edited.set(path, [...(edited.get(path) ?? []), text]);

const folded = (events: Event[]): Pending => {
  const pending: Pending = { wrote: [], edited: new Map() };
  events.forEach((event) => {
    if (event.kind === "wrote") {
      pending.wrote.push(event.path);
    } else {
      withEdit(pending.edited, event.path, event.text);
    }
  });
  return pending;
};

export const takePending = async (session: string): Promise<Pending> => {
  const raw = await readLog(session);
  await rm(logPath(session), { force: true });
  return folded(eventsIn(raw));
};

const lines = (events: Event[]) =>
  events.map((event) => `${JSON.stringify(event)}\n`).join("");

export const record = async (session: string, events: Event[]) => {
  if (events.length === 0) {
    return;
  }

  await mkdir(join(workRoot(), "sessions"), { recursive: true });
  await appendFile(logPath(session), lines(events), "utf8");
};
