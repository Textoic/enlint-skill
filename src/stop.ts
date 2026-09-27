import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { wordsIn } from "./document.js";
import { allProblems } from "./lint.js";
import { pendingFor, settle, workRoot, type Pending } from "./pending.js";
import { summary } from "./report.js";
import { finalAnswerOf } from "./transcript.js";
import type { Finding } from "./finding.js";

export type StopPayload = {
  session_id?: unknown;
  transcript_path?: unknown;
  stop_hook_active?: unknown;
  cwd?: unknown;
};

export type Limits = { words: number; issues: number; notifyOnly: boolean };

type Candidate = { label: string; source: string; file?: string; then: string; document?: string };

type Flag = { label: string; file: string; summary: string; then: string; document?: string };

const text = (value: unknown) => (typeof value === "string" ? value : "");

const readable = async (path: string) => {
  try {
    return await readFile(path, "utf8");
  } catch {
    return "";
  }
};

const shown = (path: string, cwd: string) => {
  const near = relative(cwd, path);
  return near.startsWith("..") || near === "" ? path : near;
};

const answerCandidate = async (transcript: string): Promise<Candidate[]> => {
  if (transcript === "") {
    return [];
  }

  const source = await finalAnswerOf(transcript);
  return [{ label: "your last answer", source, then: "then reply with the rewritten answer as your whole message" }];
};

const writtenCandidates = (pending: Pending, cwd: string) =>
  Promise.all(
    [...new Set(pending.wrote)]
      .filter((path) => !pending.reported.has(path))
      .map(async (path): Promise<Candidate> => ({
        label: shown(path, cwd),
        source: await readable(path),
        file: path,
        then: "then copy the rewrite over it",
        document: path,
      })),
  );

const editedCandidates = (pending: Pending, cwd: string): Candidate[] =>
  [...pending.edited]
    .filter(([path]) => !pending.reported.has(path) && !pending.wrote.includes(path))
    .map(([path, added]) => ({
      label: `your edits to ${shown(path, cwd)}`,
      source: added.join("\n\n"),
      then: `then put the rewrite back in place of the text you added to ${shown(path, cwd)}`,
      document: path,
    }));

type Linted = Candidate & { findings: Finding[] };

const linted = (limits: Limits) => (candidate: Candidate): Linted => ({
  ...candidate,
  findings: wordsIn(candidate.source) >= limits.words ? allProblems(candidate.source) : [],
});

const isFlagged = (limits: Limits) => (candidate: Linted) => candidate.findings.length >= limits.issues;

const stemOf = (label: string) =>
  label.replace(/[^A-Za-z0-9]+/gu, "-").replace(/^-|-$/gu, "").slice(0, 40) || "passage";

const saved = async (session: string, candidate: Linted): Promise<Flag> => {
  const file =
    candidate.file ?? join(workRoot(), "passages", `${stemOf(session)}-${Date.now()}-${stemOf(candidate.label)}.md`);
  if (candidate.file == null) {
    await mkdir(join(workRoot(), "passages"), { recursive: true });
    await writeFile(file, candidate.source, "utf8");
  }

  const { label, then, document, source, findings } = candidate;
  return { label, then, document, file, summary: summary(source, findings) };
};

const flagLine = (flag: Flag) => `- ${flag.label}: ${flag.summary}. Fix ${flag.file}, ${flag.then}.`;

export const reasonFor = (flags: Flag[]) =>
  `enlint flagged prose you wrote this turn. For each item below, invoke the enlint:enlint-fix skill on the path given and apply the rewrite it produces. Skip an item only when its text must stay a list or table for the reader.
${flags.map(flagLine).join("\n")}`;

const noticeFor = (flags: Flag[]) =>
  `enlint: ${flags.map((flag) => `${flag.label}: ${flag.summary}`).join("; ")}. Run /enlint-fix to rewrite.`;

const reply = (flags: Flag[], limits: Limits) =>
  limits.notifyOnly
    ? { continue: true, suppressOutput: true, systemMessage: noticeFor(flags) }
    : { decision: "block", reason: reasonFor(flags), systemMessage: noticeFor(flags) };

const candidatesFor = async (payload: StopPayload, pending: Pending) => {
  const cwd = text(payload.cwd) || process.cwd();
  return [
    ...(await answerCandidate(text(payload.transcript_path))),
    ...(await writtenCandidates(pending, cwd)),
    ...editedCandidates(pending, cwd),
  ];
};

const documentsIn = (flags: Flag[]) => flags.flatMap((flag) => (flag.document == null ? [] : [flag.document]));

export const atStop = async (payload: StopPayload, limits: Limits) => {
  if (payload.stop_hook_active === true) {
    return null;
  }

  const session = text(payload.session_id);
  const pending = await pendingFor(session);
  const candidates = (await candidatesFor(payload, pending)).map(linted(limits)).filter(isFlagged(limits));
  const flags = await Promise.all(candidates.map((candidate) => saved(session, candidate)));
  await settle(session, new Set([...pending.reported, ...documentsIn(flags)]));

  return flags.length === 0 ? null : reply(flags, limits);
};
