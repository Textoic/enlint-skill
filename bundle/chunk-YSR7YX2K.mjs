import {
  isDocument
} from "./chunk-APKFEWLS.mjs";
import {
  workRoot
} from "./chunk-MJOE2BNT.mjs";

// src/feedback.ts
import { mkdir as mkdir2, readFile as readFile2, rm, writeFile as writeFile2 } from "node:fs/promises";
import { join as join2 } from "node:path";

// src/turns.ts
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
var SKIPPED = /* @__PURE__ */ new Set(["node_modules", "dist", "build", "bundle", "out", "target", "vendor", "venv", "coverage", "__pycache__"]);
var MAX_DEPTH = 6;
var MAX_ENTRIES = 2e4;
var safeName = (session) => session.replace(/[^A-Za-z0-9_-]/gu, "_") || "unknown";
var turnPath = (session) => join(workRoot(), "sessions", `${safeName(session)}.turn.json`);
var markTurn = async (session, cwd) => {
  await mkdir(join(workRoot(), "sessions"), { recursive: true });
  await writeFile(turnPath(session), JSON.stringify({ at: Date.now(), cwd }), "utf8");
};
var turnOf = async (session) => {
  try {
    return JSON.parse(await readFile(turnPath(session), "utf8"));
  } catch {
    return null;
  }
};
var entriesOf = async (folder) => {
  try {
    return await readdir(folder, { withFileTypes: true });
  } catch {
    return [];
  }
};
var isWalkable = (entry) => entry.isDirectory() && !entry.name.startsWith(".") && !SKIPPED.has(entry.name);
var filesUnder = async (folder, depth, budget) => {
  if (depth > MAX_DEPTH || budget.left <= 0) {
    return [];
  }
  const entries = await entriesOf(folder);
  budget.left -= entries.length;
  const nested = await Promise.all(
    entries.filter(isWalkable).map((entry) => filesUnder(join(folder, entry.name), depth + 1, budget))
  );
  return [...entries.filter((entry) => entry.isFile()).map((entry) => join(folder, entry.name)), ...nested.flat()];
};
var bornSince = (since) => async (path) => {
  try {
    const { birthtimeMs } = await stat(path);
    return birthtimeMs > 0 && birthtimeMs >= since;
  } catch {
    return false;
  }
};
var createdDuring = async (turn) => {
  const documents = (await filesUnder(turn.cwd, 0, { left: MAX_ENTRIES })).filter(isDocument);
  const born = await Promise.all(documents.map(bornSince(turn.at - 1e3)));
  return documents.filter((_, index) => born[index]);
};

// src/feedback.ts
var safeName2 = (session) => session.replace(/[^A-Za-z0-9_-]/gu, "_") || "unknown";
var notePath = (session) => join2(workRoot(), "sessions", `${safeName2(session)}.feedback.txt`);
var text = (value) => typeof value === "string" ? value : "";
var leaveNote = async (session, note) => {
  await mkdir2(join2(workRoot(), "sessions"), { recursive: true });
  await writeFile2(notePath(session), note, "utf8");
};
var takeNote = async (session) => {
  try {
    const note = await readFile2(notePath(session), "utf8");
    await rm(notePath(session), { force: true });
    return note;
  } catch {
    return "";
  }
};
var atPrompt = async (payload, options = { notes: true, turns: true }) => {
  const session = text(payload.session_id);
  if (options.turns && text(payload.cwd) !== "") {
    await markTurn(session, text(payload.cwd));
  }
  const note = options.notes ? await takeNote(session) : "";
  return note === "" ? null : { hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: note } };
};

export {
  turnOf,
  createdDuring,
  leaveNote,
  atPrompt
};
