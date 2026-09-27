const FENCE = /^[ \t]*(`{3,}|~{3,})/u;

const STRUCTURED = /^(?:[ \t]|#{1,6}[ \t]|[-*+][ \t]|\d+[.)][ \t]|\||>|<)/u;

const blocksOf = (text: string) => text.split(/\n{2,}/u);

const isPlainParagraph = (block: string) =>
  block.trim() !== "" && !block.split("\n").some((line) => FENCE.test(line) || STRUCTURED.test(line));

const allButLast = (block: string) => block.trim().split("\n").slice(0, -1);

const percentile90 = (values: number[]) => [...values].sort((one, other) => one - other)[Math.floor(values.length * 0.9)];

export const wrapWidth = (source: string): number => {
  const plain = blocksOf(source).filter(isPlainParagraph);
  const wrapped = plain.filter((block) => block.trim().includes("\n"));
  if (wrapped.length === 0 || wrapped.length * 2 < plain.length) {
    return 0;
  }

  return percentile90(wrapped.flatMap(allButLast).map((line) => line.length));
};

const filled = (block: string, width: number) =>
  block
    .trim()
    .split(/\s+/u)
    .reduce((lines: string[], word) => {
      const last = lines[lines.length - 1];
      if (last !== undefined && last.length + 1 + word.length <= width) {
        lines[lines.length - 1] = `${last} ${word}`;
      } else {
        lines.push(word);
      }
      return lines;
    }, [])
    .join("\n");

const normal = (block: string) => block.trim().replace(/\s+/gu, " ");

const originalsOf = (source: string) =>
  new Map(blocksOf(source).map((block) => [normal(block), block.replace(/^\n+|\n+$/gu, "")]));

const laidOut = (block: string, width: number, originals: Map<string, string>) =>
  originals.get(normal(block)) ?? (width > 0 && isPlainParagraph(block) ? filled(block, width) : block);

export const rewrapLike = (source: string, text: string) => {
  const width = wrapWidth(source);
  const originals = originalsOf(source);
  return blocksOf(text)
    .map((block) => laidOut(block, width, originals))
    .join("\n\n");
};
