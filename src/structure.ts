import type { Finding } from "./finding.js";

const FENCE = /^ {0,3}(?:`{3,}|~{3,})/u;

const THEMATIC_BREAK = /^ {0,3}(?:(?:[-*_] *){3,})$/u;

const LIST_ITEM = /^ {0,3}(?:[-*+]|\d{1,2}[.)])[ \t]+\S/u;

const BOLD_LEAD = /^ {0,3}(\*\*\*[^\n]+?\*\*\*|\*\*[^\n]+?\*\*|__[^\n]+?__)/u;

const HEADING = /^ {0,3}#{1,6}(?:[ \t]|$)/u;

type Placed = { text: string; at: number };

type Line = Placed & { fenced: boolean; opens: boolean };

const placed = (source: string): Placed[] =>
  source.split("\n").reduce((made: Placed[], text) => {
    const last = made[made.length - 1];
    const at = last == null ? 0 : last.at + last.text.length + 1;
    return [...made, { text, at }];
  }, [] as Placed[]);

const blank = (line: Placed | undefined) =>
  line == null || line.text.trim() === "";

const ends = (line: Placed | undefined) =>
  blank(line) || HEADING.test(line?.text ?? "");

type Fenced = { open: boolean; fenced: boolean };

const fencing = (found: Placed[]): Fenced[] =>
  found.reduce((made: Fenced[], line) => {
    const open = made[made.length - 1]?.open ?? false;
    const marker = FENCE.test(line.text);
    return [...made, { open: marker ? !open : open, fenced: open || marker }];
  }, []);

const lines = (source: string): Line[] => {
  const found = placed(source);
  const fences = fencing(found);
  return found.map((line, index) => ({
    ...line,
    fenced: fences[index].fenced,
    opens: !fences[index].fenced && !blank(line) && ends(found[index - 1]),
  }));
};

const listFinding = ({ text, at }: Line): Finding => ({
  id: "no-lists",
  start: at + (text.length - text.trimStart().length),
  end: at + text.trimEnd().length,
  message:
    "This is a bulleted or numbered list item. Dissolve the list: fold what it says into running prose, and let the ideas carry from one paragraph to the next instead of being enumerated.",
});

const leadFinding = ({ text, at }: Line, bold: string): Finding => ({
  id: "no-bold-lead-ins",
  start: at + text.indexOf(bold),
  end: at + text.indexOf(bold) + bold.length,
  message:
    "This paragraph opens with a bold phrase announcing what the paragraph is about. Delete the announcement and open with the point itself.",
});

const findingIn = (line: Line): Finding[] => {
  if (line.fenced || THEMATIC_BREAK.test(line.text)) {
    return [];
  }

  if (LIST_ITEM.test(line.text)) {
    return [listFinding(line)];
  }

  const lead = line.opens ? BOLD_LEAD.exec(line.text) : null;
  return lead == null ? [] : [leadFinding(line, lead[1])];
};

export const structureProblems = (source: string): Finding[] =>
  lines(source).flatMap(findingIn);
