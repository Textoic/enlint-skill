import { defaults, ErrorId } from "@textoic/enlint";
import type { Config } from "@textoic/enlint/types";
import type { Scope } from "./finding.js";

export const known: string[] = Object.values(ErrorId);

export const SHAPE_RULES = ["no-bold-lead-ins"];

export const everyRule: Config = {
  ...defaults,
  ...(Object.fromEntries(known.map((id) => [id, true])) as Config),
};

export const editorial: Config = everyRule;

const scopeOfRule: Record<string, Scope> = {
  [ErrorId.NO_ABSOLUTE_PHRASES]: "sentences",
  [ErrorId.NO_BAD_SENTENCE_STRUCTURES]: "sentences",
  [ErrorId.NO_BAD_WORDS]: "words",
  [ErrorId.NO_EXPLAINED_ANTONYMS]: "words",
  [ErrorId.NO_EXPLAINED_INTENSIFIERS]: "words",
  [ErrorId.NO_HIGH_LEXICAL_DENSITY]: "sentences",
  [ErrorId.NO_MIXED_DIALECTS]: "words",
  [ErrorId.NO_NEGATED_CONTRASTS]: "sentences",
  [ErrorId.NO_NESTED_CLAUSES]: "sentences",
  [ErrorId.NO_NOUN_CLUSTERS]: "words",
  [ErrorId.NO_PASSIVE_SENTENCES]: "sentences",
  [ErrorId.NO_SIMILES]: "words",
  [ErrorId.NO_SPECIAL_PUNCTUATION]: "words",
  "no-bold-lead-ins": "shape",
};

export const scopeOf = ({ id }: { id: string }): Scope =>
  scopeOfRule[id] ?? "sentences";

export const inScope = (scope: Scope) => (error: { id: string }) =>
  scopeOf(error) === scope;

export const rulesScoped = (scope: Scope): string[] =>
  [...known, ...SHAPE_RULES].filter((id) => scopeOf({ id }) === scope);

export const allRules = (): string[] => [...known, ...SHAPE_RULES];

export const configure = (
  off: string[],
): { config: Config; unknown: string } => {
  const missing = off.filter(
    (id) => !known.includes(id) && !SHAPE_RULES.includes(id),
  );

  return {
    config: {
      ...everyRule,
      ...Object.fromEntries(off.map((id) => [id, false])),
    },
    unknown:
      missing.length === 0
        ? ""
        : `No rule named ${missing.join(", ")}. The rules are:\n${allRules()
            .map((id) => `  ${id}`)
            .join("\n")}`,
  };
};

export const disabledShape = (off: string[]) =>
  SHAPE_RULES.filter((id) => off.includes(id));
