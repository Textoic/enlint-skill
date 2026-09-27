import {
  record
} from "./chunk-2YZMJ4CS.mjs";
import "./chunk-R7POPVJR.mjs";

// src/record.ts
import { tmpdir } from "node:os";
import { extname, resolve, sep } from "node:path";
var PROSE_EXTENSIONS = /* @__PURE__ */ new Set([".md", ".mdx", ".markdown", ".txt", ".rst", ".adoc"]);
var isUnder = (path, folder) => path.toLowerCase().startsWith(`${resolve(folder).toLowerCase()}${sep}`);
var isAgentConfig = (path) => path.split(/[\\/]/u).some((part) => part === ".claude" || part === ".codex");
var isDocument = (path) => PROSE_EXTENSIONS.has(extname(path).toLowerCase()) && !isUnder(path, tmpdir()) && !isAgentConfig(path);
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
  return given === "" ? "" : resolve(text(payload.cwd) || ".", given);
};
var eventsFor = (payload) => {
  const build = EVENTS_FOR[text(payload.tool_name)];
  const path = targetOf(payload);
  const fromSubagent = text(payload.agent_id) !== "";
  if (build == null || path === "" || fromSubagent || !isDocument(path)) {
    return [];
  }
  return build(path, payload.tool_input ?? {});
};
var afterWrite = async (payload) => record(text(payload.session_id), eventsFor(payload));
export {
  afterWrite,
  eventsFor,
  isDocument
};
