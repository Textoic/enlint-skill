import { readFile } from "node:fs/promises";

type Block = { type?: string; text?: string };

type Entry = {
  type?: string;
  isSidechain?: boolean;
  message?: { role?: string; content?: unknown };
};

const parsedLine = (line: string): Entry | null => {
  try {
    return JSON.parse(line) as Entry;
  } catch {
    return null;
  }
};

const textOf = (content: unknown): string => {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return (content as Block[])
    .filter((block) => block?.type === "text" && typeof block.text === "string")
    .map((block) => block.text as string)
    .join("\n\n")
    .trim();
};

const entriesIn = (raw: string): Entry[] =>
  raw
    .split("\n")
    .filter((line) => line.trim() !== "")
    .flatMap((line) => {
      const entry = parsedLine(line);
      return entry == null ? [] : [entry];
    });

const isMainline = (entry: Entry) => entry.isSidechain !== true;

const isPersonTurn = (entry: Entry) =>
  entry.type === "user" &&
  isMainline(entry) &&
  textOf(entry.message?.content) !== "";

const isAnswer = (entry: Entry) =>
  entry.type === "assistant" &&
  isMainline(entry) &&
  textOf(entry.message?.content) !== "";

const callsTool = (entry: Entry) =>
  entry.type === "assistant" &&
  isMainline(entry) &&
  Array.isArray(entry.message?.content) &&
  (entry.message.content as Block[]).some((block) => block?.type === "tool_use");

const lastIndexWhere = (entries: Entry[], matches: (entry: Entry) => boolean) =>
  entries.reduce((at, entry, index) => (matches(entry) ? index : at), -1);

export const finalAnswerIn = (raw: string): string => {
  const entries = entriesIn(raw);
  const from = Math.max(
    lastIndexWhere(entries, isPersonTurn),
    lastIndexWhere(entries, callsTool),
  );
  return entries
    .slice(from + 1)
    .filter(isAnswer)
    .map((entry) => textOf(entry.message?.content))
    .join("\n\n")
    .trim();
};

export const finalAnswerOf = async (path: string): Promise<string> =>
  finalAnswerIn(await readFile(path, "utf8"));
