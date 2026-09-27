import type { Dirent } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { workRoot } from "./pending.js";
import { isDocument } from "./record.js";

export type Turn = { at: number; cwd: string };

const SKIPPED = new Set(["node_modules", "dist", "build", "bundle", "out", "target", "vendor", "venv", "coverage", "__pycache__"]);

const MAX_DEPTH = 6;

const MAX_ENTRIES = 20_000;

const safeName = (session: string) => session.replace(/[^A-Za-z0-9_-]/gu, "_") || "unknown";

const turnPath = (session: string) => join(workRoot(), "sessions", `${safeName(session)}.turn.json`);

export const markTurn = async (session: string, cwd: string) => {
  await mkdir(join(workRoot(), "sessions"), { recursive: true });
  await writeFile(turnPath(session), JSON.stringify({ at: Date.now(), cwd }), "utf8");
};

export const turnOf = async (session: string): Promise<Turn | null> => {
  try {
    return JSON.parse(await readFile(turnPath(session), "utf8")) as Turn;
  } catch {
    return null;
  }
};

const entriesOf = async (folder: string): Promise<Dirent[]> => {
  try {
    return await readdir(folder, { withFileTypes: true });
  } catch {
    return [];
  }
};

const isWalkable = (entry: Dirent) => entry.isDirectory() && !entry.name.startsWith(".") && !SKIPPED.has(entry.name);

const filesUnder = async (folder: string, depth: number, budget: { left: number }): Promise<string[]> => {
  if (depth > MAX_DEPTH || budget.left <= 0) {
    return [];
  }

  const entries = await entriesOf(folder);
  budget.left -= entries.length;
  const nested = await Promise.all(
    entries.filter(isWalkable).map((entry) => filesUnder(join(folder, entry.name), depth + 1, budget)),
  );
  return [...entries.filter((entry) => entry.isFile()).map((entry) => join(folder, entry.name)), ...nested.flat()];
};

const bornSince = (since: number) => async (path: string) => {
  try {
    const { birthtimeMs } = await stat(path);
    return birthtimeMs > 0 && birthtimeMs >= since;
  } catch {
    return false;
  }
};

export const createdDuring = async (turn: Turn) => {
  const documents = (await filesUnder(turn.cwd, 0, { left: MAX_ENTRIES })).filter(isDocument);
  const born = await Promise.all(documents.map(bornSince(turn.at - 1000)));
  return documents.filter((_, index) => born[index]);
};
