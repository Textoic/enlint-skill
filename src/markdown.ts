const blank = (text: string) => text.replace(/[^\n]/gu, " ");

const label = (match: string, text: string) => {
  const at = match.indexOf(text);
  return (
    blank(match.slice(0, at)) + text + blank(match.slice(at + text.length))
  );
};

const MASKS: [RegExp, (match: string, ...groups: string[]) => string][] = [
  [/^---[ \t]*\n[\s\S]*?\n---[ \t]*(?=\n|$)/u, blank],
  [/^[ \t]*(`{3,}|~{3,})[\s\S]*?(?:\n[ \t]*\1[^\n]*|$(?![\s\S]))/gmu, blank],
  [/<!--[\s\S]*?-->/gu, blank],
  [/<\/?[a-zA-Z][^>\n]*>/gu, blank],
  [/`[^`\n]*`/gu, blank],
  [/"[^"\n]{1,80}"/gu, blank],
  [/“[^”\n]{1,80}”/gu, blank],
  [/^[ \t]*\[[^\]\n]+\]:[^\n]*$/gmu, blank],
  [/!?\[([^\]\n]*)\]\([^)\n]*\)/gu, label],
  [/!?\[([^\]\n]*)\]\[[^\]\n]*\]/gu, label],
  [/<[a-z][\w+.-]*:\/\/[^>\s]*>/giu, blank],
  [/\b[a-z][\w+.-]*:\/\/\S+|\bwww\.\S+/giu, blank],
  [/^[ \t]*(?:#{1,6}[ \t]+|>[ \t]?|[-*+][ \t]+|\d+[.)][ \t]+)/gmu, blank],
  [/[ \t]#+[ \t]*$/gmu, blank],
  [/^[ \t]*[-=|:*_ \t]{3,}$/gmu, blank],
  [/[[\]|]/gu, blank],
  [/\*+|~~+/gu, blank],
  [/(?<!\w)_+|_+(?!\w)/gu, blank],
];

const mask = (text: string): string =>
  MASKS.reduce(
    (masked, [pattern, replace]) =>
      masked.replace(pattern, replace as (...args: string[]) => string),
    text,
  );

export default mask;

export type Block = { at: number; text: string };

const STANDALONE =
  /^[ \t]*(?:#{1,6}[ \t]|>|[-*+][ \t]|\d+[.)][ \t]|\||={2,}|-{2,}|`{3,}|~{3,})/u;

export const blocks = (text: string): Block[] => {
  const lines = text.split("\n");
  const masked = mask(text).split("\n");

  const found: Block[] = [];
  let open: Block | null = null;
  let offset = 0;

  const close = () => {
    if (open && open.text.trim() !== "") {
      found.push(open);
    }

    open = null;
  };

  lines.forEach((line, index) => {
    const empty = line.trim() === "";
    if (empty || STANDALONE.test(line)) {
      close();
    }

    if (!empty) {
      open =
        open == null
          ? { at: offset, text: masked[index] }
          : { at: open.at, text: `${open.text}\n${masked[index]}` };
    }

    offset += line.length + 1;
  });

  close();
  return found;
};
