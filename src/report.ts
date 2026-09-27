import { scopeOf } from "./config.js";
import { wordsIn } from "./document.js";
import type { Finding, Scope } from "./finding.js";

const collapse = (text: string) => text.replace(/\s+/gu, " ").trim();

const QUOTED = 48;

export const spanOf = (source: string, { start, end }: Finding) =>
  collapse(source.slice(start, end));

export const shortSpan = (source: string, finding: Finding) => {
  const span = spanOf(source, finding);
  return span.length > QUOTED ? `${span.slice(0, QUOTED - 3)}...` : span;
};

export type Place = { line: number; column: number };

export const place = (source: string, at: number): Place => {
  const before = source.slice(0, at);
  const line = before.split("\n").length;
  return { line, column: at - (before.lastIndexOf("\n") + 1) + 1 };
};

const ORDER: Scope[] = ["shape", "sentences", "words"];

export const grouped = (findings: Finding[]): Map<Scope, Finding[]> =>
  findings.reduce(
    (by: Map<Scope, Finding[]>, finding) => {
      const scope = scopeOf(finding);
      return by.set(scope, [...(by.get(scope) ?? []), finding]);
    },
    new Map<Scope, Finding[]>(),
  );

const shortRule = (id: string) => id.replace(/^no-/u, "");

const SAMPLES = 3;

const labelsFor = (source: string, scope: Scope, found: Finding[]) =>
  scope === "words"
    ? [...new Set(found.map((one) => shortSpan(source, one)))]
    : [...new Set(found.map((one) => shortRule(one.id)))];

const scopePart = (source: string, scope: Scope, found: Finding[]) => {
  const labels = labelsFor(source, scope, found);
  const shown = labels.slice(0, SAMPLES).join(", ");
  const more = labels.length > SAMPLES ? ", ..." : "";
  return `${found.length} ${scope} (${shown}${more})`;
};

export const summary = (source: string, findings: Finding[]): string => {
  if (findings.length === 0) {
    return "";
  }

  const by = grouped(findings);
  const parts = ORDER.filter((scope) => (by.get(scope) ?? []).length > 0).map(
    (scope) => scopePart(source, scope, by.get(scope) as Finding[]),
  );
  return `${findings.length} style ${
    findings.length === 1 ? "issue" : "issues"
  } — ${parts.join("; ")}`;
};

const OFFERED = 56;

const swapsOffered = (source: string, finding: Finding) => {
  const swaps = (finding.suggestions ?? [])
    .filter(
      ({ range: [from, to] }) => from === finding.start && to === finding.end,
    )
    .map(({ text }) => collapse(text))
    .filter((text) => text !== "");
  if (swaps.length === 0) {
    return "";
  }

  const joined = swaps.join(", ");
  return `  -> ${
    joined.length > OFFERED ? `${joined.slice(0, OFFERED - 3)}...` : joined
  }`;
};

const row = (source: string, finding: Finding) => {
  const { line, column } = place(source, finding.start);
  const at = `${line}:${column}`.padEnd(8);
  const scope = scopeOf(finding).padEnd(10);
  const rule = finding.id.padEnd(28);
  return `  ${at}${scope}${rule}"${shortSpan(source, finding)}"${swapsOffered(
    source,
    finding,
  )}`;
};

export const listing = (source: string, findings: Finding[]): string =>
  findings.map((finding) => row(source, finding)).join("\n");

export const header = (
  source: string,
  findings: Finding[],
  label: string,
): string =>
  `${label}: ${wordsIn(source)} words, ${findings.length} ${
    findings.length === 1 ? "issue" : "issues"
  }`;

export const density = (source: string, findings: Finding[]): number => {
  const total = wordsIn(source);
  return total === 0 ? 0 : (findings.length / total) * 100;
};
