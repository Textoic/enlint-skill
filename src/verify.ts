import type { Config } from "english-lint/types";
import { sentences } from "./document.js";
import { allProblems } from "./lint.js";
import type { Finding } from "./finding.js";

export type Tally = { ruleId: string; before: number; after: number };

export type Verdict = {
  asked: number;
  cleared: number;
  survived: number;
  introduced: number;
  byRule: Tally[];
};

const countsOf = (errors: Finding[]) =>
  errors.reduce(
    (counts: Map<string, number>, { id }) =>
      counts.set(id, (counts.get(id) ?? 0) + 1),
    new Map<string, number>(),
  );

const ruleIdsIn = (before: Finding[], after: Finding[]) => [
  ...new Set([...before, ...after].map(({ id }) => id)),
];

const talliesFor = (before: Finding[], after: Finding[]): Tally[] => {
  const was = countsOf(before);
  const now = countsOf(after);
  return ruleIdsIn(before, after)
    .map((ruleId) => ({
      ruleId,
      before: was.get(ruleId) ?? 0,
      after: now.get(ruleId) ?? 0,
    }))
    .sort(
      (one, other) =>
        other.before - one.before || (one.ruleId < other.ruleId ? -1 : 1),
    );
};

const summed = (tallies: Tally[], of: (tally: Tally) => number) =>
  tallies.reduce((total, tally) => total + of(tally), 0);

export const verdictOf = (before: Finding[], after: Finding[]): Verdict => {
  const byRule = talliesFor(before, after);
  return {
    asked: before.length,
    cleared: summed(byRule, ({ before: was, after: now }) =>
      Math.max(was - now, 0),
    ),
    survived: summed(byRule, ({ before: was, after: now }) =>
      Math.min(was, now),
    ),
    introduced: summed(byRule, ({ before: was, after: now }) =>
      Math.max(now - was, 0),
    ),
    byRule,
  };
};

export const verify = (was: string, now: string, config: Config): Verdict =>
  verdictOf(allProblems(was, config), allProblems(now, config));

const shortfall = ({ survived, introduced }: Verdict) =>
  [
    survived > 0 ? `${survived} still flagged` : "",
    introduced > 0 ? `${introduced} newly flagged` : "",
  ].filter((part) => part !== "");

export const describeVerdict = (verdict: Verdict) => {
  const missed = shortfall(verdict);
  return missed.length === 0
    ? `cleared all ${verdict.asked}`
    : `cleared ${verdict.cleared} of ${verdict.asked}, ${missed.join(", ")}`;
};

const contentWords = (text: string) =>
  sentences(text)
    .flat()
    .filter(({ xpos }) => xpos !== "PUNCT");

export const nounShare = (text: string): number => {
  const found = contentWords(text);
  if (found.length === 0) {
    return 0;
  }

  const nouns = found.filter(
    ({ xpos, feats }) => xpos === "NOUN" && feats.PronType == null,
  ).length;
  return (nouns / found.length) * 100;
};

const mean = (numbers: number[]) =>
  numbers.length === 0
    ? 0
    : numbers.reduce((total, one) => total + one, 0) / numbers.length;

const sentenceLengths = (text: string) =>
  sentences(text)
    .map((tokens) => tokens.filter(({ xpos }) => xpos !== "PUNCT").length)
    .filter((length) => length > 0);

export const sentenceProfile = (text: string) => {
  const lengths = sentenceLengths(text);
  return {
    count: lengths.length,
    average: Math.round(mean(lengths)),
    longest: Math.max(0, ...lengths),
  };
};

const DENSER_BY = 5;

export const moreMachineLike = (tried: string, best: string): boolean =>
  nounShare(tried) > nounShare(best) + DENSER_BY;
