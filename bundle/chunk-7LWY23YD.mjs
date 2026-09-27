var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

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
  __commonJS,
  __export,
  __toESM,
  workRoot,
  takePending,
  record
};
