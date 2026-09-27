import { ErrorId } from "english-lint";
import type { Config } from "english-lint/types";
import { proseProblems } from "./lint.js";
import type { Finding } from "./finding.js";

const DETERMINISTIC: string[] = [ErrorId.NO_SPECIAL_PUNCTUATION];

export type Swap = {
  start: number;
  end: number;
  replacement: string;
  ruleId: string;
};

const swapFor = (error: Finding): Swap | null => {
  const [offered] = error.suggestions ?? [];
  if (offered == null || offered.text === "") {
    return null;
  }

  const [start, end] = offered.range;
  return { start, end, replacement: offered.text, ruleId: error.id };
};

const overlaps = (one: Swap, other: Swap) =>
  one.start < other.end && other.start < one.end;

const settled = (swaps: Swap[]): Swap[] =>
  [...swaps]
    .sort((one, other) => one.start - other.start || one.end - other.end)
    .reduce(
      (kept: Swap[], swap) =>
        kept.some((keeper) => overlaps(keeper, swap)) ? kept : [...kept, swap],
      [],
    );

export const applied = (source: string, swaps: Swap[]): string =>
  settled(swaps)
    .slice()
    .reverse()
    .reduce(
      (text, { start, end, replacement }) =>
        text.slice(0, start) + replacement + text.slice(end),
      source,
    );

export const swapsFor = (source: string, config: Config): Swap[] =>
  settled(
    proseProblems(source, config)
      .filter(({ id }) => DETERMINISTIC.includes(id))
      .flatMap((error) => {
        const swap = swapFor(error);
        return swap == null ? [] : [swap];
      }),
  );

export type Mechanical = { text: string; swaps: Swap[] };

export const mechanically = (source: string, config: Config): Mechanical => {
  const swaps = swapsFor(source, config);
  return { text: applied(source, swaps), swaps };
};
