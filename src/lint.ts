import lint from "english-lint";
import type { Config } from "english-lint/types";
import { editorial } from "./config.js";
import { sentences } from "./document.js";
import { structureProblems } from "./structure.js";
import type { Finding } from "./finding.js";

export const proseProblems = (
  source: string,
  config: Config = editorial,
): Finding[] => lint(sentences(source), config);

const byPosition = (one: Finding, other: Finding) =>
  one.start - other.start || one.end - other.end;

export const allProblems = (
  source: string,
  config: Config = editorial,
  { shape = true }: { shape?: boolean } = {},
): Finding[] =>
  [
    ...proseProblems(source, config),
    ...(shape ? structureProblems(source) : []),
  ].sort(byPosition);
