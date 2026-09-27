import { tmpdir } from "node:os";
import { extname, relative, resolve, sep } from "node:path";
import { patchEvents } from "./patch.js";
import { record, type Event } from "./pending.js";

type Edit = { new_string?: unknown };

export type ToolPayload = {
  session_id?: unknown;
  tool_name?: unknown;
  cwd?: unknown;
  tool_input?: {
    file_path?: unknown;
    new_string?: unknown;
    edits?: unknown;
    command?: unknown;
  };
};

const PROSE_EXTENSIONS = new Set([".md", ".mdx", ".markdown", ".txt", ".rst", ".adoc"]);

const isUnder = (path: string, folder: string) =>
  path.toLowerCase().startsWith(`${resolve(folder).toLowerCase()}${sep}`);

const isEnlintWork = (path: string) =>
  isUnder(path, tmpdir()) && relative(tmpdir(), path).toLowerCase().startsWith("enlint");

const isAgentConfig = (path: string) =>
  path.split(/[\\/]/u).some((part) => part === ".claude" || part === ".codex");

export const isDocument = (path: string) =>
  PROSE_EXTENSIONS.has(extname(path).toLowerCase()) &&
  !isEnlintWork(path) &&
  !isAgentConfig(path);

const text = (value: unknown) => (typeof value === "string" ? value : "");

const addedBy = (input: NonNullable<ToolPayload["tool_input"]>) =>
  [
    text(input.new_string),
    ...(Array.isArray(input.edits) ? (input.edits as Edit[]) : []).map((edit) =>
      text(edit?.new_string),
    ),
  ].filter((one) => one.trim() !== "");

const EVENTS_FOR: Record<string, (path: string, input: NonNullable<ToolPayload["tool_input"]>) => Event[]> = {
  Write: (path) => [{ kind: "wrote", path }],
  Edit: (path, input) => addedBy(input).map((added) => ({ kind: "edited", path, text: added })),
  MultiEdit: (path, input) => addedBy(input).map((added) => ({ kind: "edited", path, text: added })),
};

const targetOf = (payload: ToolPayload) => {
  const given = text(payload.tool_input?.file_path);
  return given === "" ? "" : resolve(text(payload.cwd) || ".", given);
};

const patched = (payload: ToolPayload) =>
  patchEvents(text(payload.tool_input?.command), text(payload.cwd) || ".").filter((event) => isDocument(event.path));

export const eventsFor = (payload: ToolPayload): Event[] => {
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

export const afterWrite = async (payload: ToolPayload) =>
  record(text(payload.session_id), eventsFor(payload));
