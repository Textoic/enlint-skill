// src/transcript.ts
import { readFile } from "node:fs/promises";
var parsedLine = (line) => {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
};
var textOf = (content) => {
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return "";
  }
  return content.filter((block) => block?.type === "text" && typeof block.text === "string").map((block) => block.text).join("\n\n").trim();
};
var entriesIn = (raw) => raw.split("\n").filter((line) => line.trim() !== "").flatMap((line) => {
  const entry = parsedLine(line);
  return entry == null ? [] : [entry];
});
var isMainline = (entry) => entry.isSidechain !== true;
var isPersonTurn = (entry) => entry.type === "user" && isMainline(entry) && textOf(entry.message?.content) !== "";
var isAnswer = (entry) => entry.type === "assistant" && isMainline(entry) && textOf(entry.message?.content) !== "";
var callsTool = (entry) => entry.type === "assistant" && isMainline(entry) && Array.isArray(entry.message?.content) && entry.message.content.some((block) => block?.type === "tool_use");
var lastIndexWhere = (entries, matches) => entries.reduce((at, entry, index) => matches(entry) ? index : at, -1);
var finalAnswerIn = (raw) => {
  const entries = entriesIn(raw);
  const from = Math.max(
    lastIndexWhere(entries, isPersonTurn),
    lastIndexWhere(entries, callsTool)
  );
  return entries.slice(from + 1).filter(isAnswer).map((entry) => textOf(entry.message?.content)).join("\n\n").trim();
};
var finalAnswerOf = async (path) => finalAnswerIn(await readFile(path, "utf8"));

export {
  finalAnswerOf
};
