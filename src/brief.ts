import { wordsIn } from "./document.js";
import { grouped, place, spanOf } from "./report.js";
import { sentenceProfile } from "./verify.js";
import type { Finding, Scope } from "./finding.js";

const HEADINGS: Record<Scope, string> = {
  shape: "Pass 1 - shape of the passage",
  sentences: "Pass 2 - how sentences are built",
  words: "Pass 3 - word choice",
};

const ORDER: Scope[] = ["shape", "sentences", "words"];

const swapsOffered = (finding: Finding) =>
  (finding.suggestions ?? [])
    .filter(
      ({ range: [from, to] }) => from === finding.start && to === finding.end,
    )
    .map(({ text }) => text)
    .filter((text) => text !== "");

const shapeLine = (source: string, finding: Finding) => {
  const { line } = place(source, finding.start);
  return `- line ${line}: ${finding.message}`;
};

const proseLine = (source: string, finding: Finding) => {
  const { line } = place(source, finding.start);
  const swaps = swapsOffered(finding);
  const offered =
    swaps.length === 0
      ? ""
      : `\n  Replacements the rule offers, any of which you may use: ${swaps.join(
          ", ",
        )}`;
  return `- line ${line}, "${spanOf(source, finding)}" — ${
    finding.message
  }${offered}`;
};

const section = (source: string, scope: Scope, found: Finding[]) =>
  `### ${HEADINGS[scope]} (${found.length})

${found
  .map((finding) =>
    scope === "shape" ? shapeLine(source, finding) : proseLine(source, finding),
  )
  .join("\n")}`;

const rhythm = (source: string) => {
  const { count, average, longest } = sentenceProfile(source);
  return count < 2
    ? ""
    : `The passage runs ${count} sentences, averaging ${average} words, longest ${longest}. Hand back one with the same shape: about ${count} sentences, not twice that, and the same spread between longest and shortest. A run of ${
        count * 2
      } short sentences all the same size is a failed edit however many flags it clears.`;
};

export type BriefInput = {
  source: string;
  findings: Finding[];
  outPath: string;
  label: string;
};

export const brief = ({
  source,
  findings,
  outPath,
  label,
}: BriefInput): string => {
  const by = grouped(findings);
  const sections = ORDER.filter(
    (scope) => (by.get(scope) ?? []).length > 0,
  ).map((scope) => section(source, scope, by.get(scope) as Finding[]));

  return `# Rewrite brief

Source: ${label} — ${wordsIn(source)} words, ${findings.length} flagged.

Rewrite the passage at the end of this file so it follows the style guide in
your instructions and clears the findings below. Work the three passes in
order: shape first, then sentence construction, then word choice.

**Write the finished passage, and nothing else, to this file:**

    ${outPath}

Keep every idea and every fact. You are repacking the passage, not summarising
it: the result should be about as long as what you were given. Code blocks,
inline code, links and URLs come back untouched, character for character.

${rhythm(source)}

## What the linter found

${sections.join("\n\n")}

## The passage to rewrite

${source}
`;
};
