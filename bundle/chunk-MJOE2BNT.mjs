// src/pending.ts
import { appendFile, mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
var workRoot = () => join(tmpdir(), "enlint");
var safeName = (session) => session.replace(/[^A-Za-z0-9_-]/gu, "_") || "unknown";
var logPath = (session) => join(workRoot(), "sessions", `${safeName(session)}.jsonl`);
var parsedEvent = (line) => {
  try {
    return [JSON.parse(line)];
  } catch {
    return [];
  }
};
var eventsIn = (raw) => raw.split("\n").filter((line) => line.trim() !== "").flatMap(parsedEvent);
var readLog = async (session) => {
  try {
    return await readFile(logPath(session), "utf8");
  } catch {
    return "";
  }
};
var withEdit = (edited, path, text) => edited.set(path, [...edited.get(path) ?? [], text]);
var folded = (events) => {
  const pending = { wrote: [], edited: /* @__PURE__ */ new Map() };
  events.forEach((event) => {
    if (event.kind === "wrote") {
      pending.wrote.push(event.path);
    } else {
      withEdit(pending.edited, event.path, event.text);
    }
  });
  return pending;
};
var takePending = async (session) => {
  const raw = await readLog(session);
  await rm(logPath(session), { force: true });
  return folded(eventsIn(raw));
};
var lines = (events) => events.map((event) => `${JSON.stringify(event)}
`).join("");
var record = async (session, events) => {
  if (events.length === 0) {
    return;
  }
  await mkdir(join(workRoot(), "sessions"), { recursive: true });
  await appendFile(logPath(session), lines(events), "utf8");
};

export {
  workRoot,
  takePending,
  record
};
