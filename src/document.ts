import { blocks } from "./markdown.js";
import parse from "./nlp.js";
import type { ParsedToken } from "english-lint/types";

export type Chunk = { at: number; text: string };

export type Span = {
  at: number;
  text: string;
  opens?: boolean;
};

export const sentences = (source: string): ParsedToken[][] =>
  blocks(source).flatMap((block) =>
    parse(block.text).map((tokens) =>
      tokens.map((token) => ({
        ...token,
        misc: { ...token.misc, at: token.misc.at + block.at },
      })),
    ),
  );

export const spans = (source: string, parsed: ParsedToken[][]): Span[] =>
  parsed
    .filter((tokens) => tokens.length > 0)
    .map((tokens) => {
      const last = tokens[tokens.length - 1];
      const { at } = tokens[0].misc;
      return {
        at,
        text: source
          .slice(at, last.misc.at + last.form.length)
          .replace(/[\r\n]/gu, " "),
      };
    });

export const words = (parsed: ParsedToken[][]) =>
  parsed.flat().filter(({ xpos }) => xpos !== "PUNCT").length;

export const wordsIn = (text: string) => (text.match(/\S+/gu) ?? []).length;

const WORDS = 500;

const size = (found: Span[]) =>
  found.reduce(
    (total, { text }) => total + (text.match(/\S+/gu) ?? []).length,
    0,
  );

const cut = (block: Span[], budget: number): Span[][] =>
  block.reduce((runs: Span[][], span) => {
    const last = runs[runs.length - 1];
    return last != null && size(last) + size([span]) <= budget
      ? [...runs.slice(0, -1), [...last, span]]
      : [...runs, [span]];
  }, []);

export const chunks = (
  source: string,
  parsed: Span[],
  { words: budget = WORDS }: { words?: number } = {},
): Span[][] => {
  const grouped = blocks(source)
    .map((block) => {
      const end = block.at + block.text.length;
      return parsed
        .filter(({ at }) => at >= block.at && at < end)
        .map((span, index) => (index === 0 ? { ...span, opens: true } : span));
    })
    .filter((block) => block.length > 0);

  return grouped.reduce((made: Span[][], block) => {
    const last = made[made.length - 1];
    if (last != null && size(last) + size(block) <= budget) {
      return [...made.slice(0, -1), [...last, ...block]];
    }

    return size(block) <= budget
      ? [...made, block]
      : [...made, ...cut(block, budget)];
  }, []);
};

const endOf = (passage: Span[]) => {
  const last = passage[passage.length - 1];
  return last.at + last.text.length;
};

const lineStart = (source: string, at: number) =>
  source.lastIndexOf("\n", at - 1) + 1;

const lineEnd = (source: string, at: number) => {
  const broken = source.indexOf("\n", at);
  return broken === -1 ? source.length : broken;
};

const widened = (source: string, passages: Span[][]): Chunk[] => {
  const starts = passages.reduce((made: number[], passage, index) => {
    const settled = index === 0 ? 0 : endOf(passages[index - 1]);
    return [...made, Math.max(lineStart(source, passage[0].at), settled)];
  }, []);

  return passages.map((passage, index) => {
    const from = starts[index];
    const to = Math.min(
      lineEnd(source, endOf(passage)),
      starts[index + 1] ?? source.length,
    );
    return { at: from, text: source.slice(from, to) };
  });
};

export const passagesIn = (source: string, budget: number): Chunk[] =>
  widened(source, chunks(source, spans(source, sentences(source)), {
    words: budget,
  }));
