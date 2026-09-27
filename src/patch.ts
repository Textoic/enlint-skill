import { resolve } from "node:path";
import type { Event } from "./pending.js";

type Part = { kind: "wrote" | "edited"; path: string; runs: string[][] };

const HEADER = /^\*\*\* (Add|Update) File: (.+)$/u;

const KIND_FOR: Record<string, Part["kind"]> = { Add: "wrote", Update: "edited" };

const opened = (parts: Part[], header: RegExpExecArray, cwd: string): Part[] => [
  ...parts,
  { kind: KIND_FOR[header[1]], path: resolve(cwd, header[2].trim()), runs: [] },
];

const extended = (part: Part, line: string) => {
  const added = line.startsWith("+") && !line.startsWith("+++");
  const last = part.runs[part.runs.length - 1];
  if (added && last != null && last.length > 0) {
    last.push(line.slice(1));
  } else if (added) {
    part.runs.push([line.slice(1)]);
  } else if (last != null && last.length > 0) {
    part.runs.push([]);
  }
};

const partsOf = (patch: string, cwd: string) =>
  patch.split(/\r?\n/u).reduce((parts: Part[], line) => {
    const header = HEADER.exec(line);
    if (header != null) {
      return opened(parts, header, cwd);
    }

    const current = parts[parts.length - 1];
    if (current != null) {
      extended(current, line);
    }
    return parts;
  }, []);

const eventsOfPart = (part: Part): Event[] =>
  part.kind === "wrote"
    ? [{ kind: "wrote", path: part.path }]
    : part.runs
        .map((run) => run.join("\n"))
        .filter((run) => run.trim() !== "")
        .map((run) => ({ kind: "edited", path: part.path, text: run }));

export const patchEvents = (patch: string, cwd: string): Event[] => partsOf(patch, cwd).flatMap(eventsOfPart);
