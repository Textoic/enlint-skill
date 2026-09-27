import {
  record
} from "./chunk-MJOE2BNT.mjs";

// src/record.ts
import { tmpdir } from "node:os";
import { extname, relative, resolve as resolve2, sep } from "node:path";

// src/patch.ts
import { resolve } from "node:path";
var HEADER = /^\*\*\* (Add|Update) File: (.+)$/u;
var KIND_FOR = { Add: "wrote", Update: "edited" };
var opened = (parts, header, cwd) => [
  ...parts,
  { kind: KIND_FOR[header[1]], path: resolve(cwd, header[2].trim()), runs: [] }
];
var extended = (part, line) => {
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
var partsOf = (patch, cwd) => patch.split(/\r?\n/u).reduce((parts, line) => {
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
var eventsOfPart = (part) => part.kind === "wrote" ? [{ kind: "wrote", path: part.path }] : part.runs.map((run) => run.join("\n")).filter((run) => run.trim() !== "").map((run) => ({ kind: "edited", path: part.path, text: run }));
var patchEvents = (patch, cwd) => partsOf(patch, cwd).flatMap(eventsOfPart);

// src/record.ts
var PROSE_EXTENSIONS = /* @__PURE__ */ new Set([".md", ".mdx", ".markdown", ".txt", ".rst", ".adoc"]);
var isUnder = (path, folder) => path.toLowerCase().startsWith(`${resolve2(folder).toLowerCase()}${sep}`);
var isEnlintWork = (path) => isUnder(path, tmpdir()) && relative(tmpdir(), path).toLowerCase().startsWith("enlint");
var isAgentConfig = (path) => path.split(/[\\/]/u).some((part) => part === ".claude" || part === ".codex");
var isDocument = (path) => PROSE_EXTENSIONS.has(extname(path).toLowerCase()) && !isEnlintWork(path) && !isAgentConfig(path);
var text = (value) => typeof value === "string" ? value : "";
var addedBy = (input) => [
  text(input.new_string),
  ...(Array.isArray(input.edits) ? input.edits : []).map(
    (edit) => text(edit?.new_string)
  )
].filter((one) => one.trim() !== "");
var EVENTS_FOR = {
  Write: (path) => [{ kind: "wrote", path }],
  Edit: (path, input) => addedBy(input).map((added) => ({ kind: "edited", path, text: added })),
  MultiEdit: (path, input) => addedBy(input).map((added) => ({ kind: "edited", path, text: added }))
};
var targetOf = (payload) => {
  const given = text(payload.tool_input?.file_path);
  return given === "" ? "" : resolve2(text(payload.cwd) || ".", given);
};
var patched = (payload) => patchEvents(text(payload.tool_input?.command), text(payload.cwd) || ".").filter((event) => isDocument(event.path));
var eventsFor = (payload) => {
  if (payload.tool_name === "apply_patch") {
    return patched(payload);
  }
  const build = EVENTS_FOR[text(payload.tool_name)];
  const path = targetOf(payload);
  if (build == null || path === "" || !isDocument(path)) {
    return [];
  }
  return build(path, payload.tool_input ?? {});
};
var afterWrite = async (payload) => record(text(payload.session_id), eventsFor(payload));

export {
  isDocument,
  eventsFor,
  afterWrite
};
