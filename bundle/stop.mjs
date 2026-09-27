import {
  allProblems,
  finalAnswerOf,
  summary,
  wordsIn
} from "./chunk-UUAUWUB3.mjs";
import {
  pendingFor,
  settle,
  workRoot
} from "./chunk-2YZMJ4CS.mjs";
import "./chunk-R7POPVJR.mjs";

// src/stop.ts
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
var text = (value) => typeof value === "string" ? value : "";
var readable = async (path) => {
  try {
    return await readFile(path, "utf8");
  } catch {
    return "";
  }
};
var shown = (path, cwd) => {
  const near = relative(cwd, path);
  return near.startsWith("..") || near === "" ? path : near;
};
var answerCandidate = async (transcript) => {
  if (transcript === "") {
    return [];
  }
  const source = await finalAnswerOf(transcript);
  return [{ label: "your last answer", source, then: "then reply with the rewritten answer as your whole message" }];
};
var writtenCandidates = (pending, cwd) => Promise.all(
  [...new Set(pending.wrote)].filter((path) => !pending.reported.has(path)).map(async (path) => ({
    label: shown(path, cwd),
    source: await readable(path),
    file: path,
    then: "then copy the rewrite over it",
    document: path
  }))
);
var editedCandidates = (pending, cwd) => [...pending.edited].filter(([path]) => !pending.reported.has(path) && !pending.wrote.includes(path)).map(([path, added]) => ({
  label: `your edits to ${shown(path, cwd)}`,
  source: added.join("\n\n"),
  then: `then put the rewrite back in place of the text you added to ${shown(path, cwd)}`,
  document: path
}));
var linted = (limits) => (candidate) => ({
  ...candidate,
  findings: wordsIn(candidate.source) >= limits.words ? allProblems(candidate.source) : []
});
var isFlagged = (limits) => (candidate) => candidate.findings.length >= limits.issues;
var stemOf = (label) => label.replace(/[^A-Za-z0-9]+/gu, "-").replace(/^-|-$/gu, "").slice(0, 40) || "passage";
var saved = async (session, candidate) => {
  const file = candidate.file ?? join(workRoot(), "passages", `${stemOf(session)}-${Date.now()}-${stemOf(candidate.label)}.md`);
  if (candidate.file == null) {
    await mkdir(join(workRoot(), "passages"), { recursive: true });
    await writeFile(file, candidate.source, "utf8");
  }
  const { label, then, document, source, findings } = candidate;
  return { label, then, document, file, summary: summary(source, findings) };
};
var flagLine = (flag) => `- ${flag.label}: ${flag.summary}. Fix ${flag.file}, ${flag.then}.`;
var reasonFor = (flags) => `enlint flagged prose you wrote this turn. For each item below, invoke the enlint:enlint-fix skill on the path given and apply the rewrite it produces. Skip an item only when its text must stay a list or table for the reader.
${flags.map(flagLine).join("\n")}`;
var noticeFor = (flags) => `enlint: ${flags.map((flag) => `${flag.label}: ${flag.summary}`).join("; ")}. Run /enlint-fix to rewrite.`;
var reply = (flags, limits) => limits.notifyOnly ? { continue: true, suppressOutput: true, systemMessage: noticeFor(flags) } : { decision: "block", reason: reasonFor(flags), systemMessage: noticeFor(flags) };
var candidatesFor = async (payload, pending) => {
  const cwd = text(payload.cwd) || process.cwd();
  return [
    ...await answerCandidate(text(payload.transcript_path)),
    ...await writtenCandidates(pending, cwd),
    ...editedCandidates(pending, cwd)
  ];
};
var documentsIn = (flags) => flags.flatMap((flag) => flag.document == null ? [] : [flag.document]);
var atStop = async (payload, limits) => {
  if (payload.stop_hook_active === true) {
    return null;
  }
  const session = text(payload.session_id);
  const pending = await pendingFor(session);
  const candidates = (await candidatesFor(payload, pending)).map(linted(limits)).filter(isFlagged(limits));
  const flags = await Promise.all(candidates.map((candidate) => saved(session, candidate)));
  await settle(session, /* @__PURE__ */ new Set([...pending.reported, ...documentsIn(flags)]));
  return flags.length === 0 ? null : reply(flags, limits);
};
export {
  atStop,
  reasonFor
};
