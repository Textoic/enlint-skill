import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { allRules, configure, editorial } from "./config.js";
import { wordsIn } from "./document.js";
import { allProblems } from "./lint.js";
import { mechanically } from "./mechanical.js";
import { brief } from "./brief.js";
import { density, header, listing, summary } from "./report.js";
import { finalAnswerOf } from "./transcript.js";
import { historyPath } from "./background.js";
import { describeVerdict, verdictOf } from "./verify.js";
import type { Finding } from "./finding.js";

const USAGE = `enlint - lint and rewrite English prose with the enlint rules

  enlint check <file|->            list the style problems in a file
  enlint check --transcript <p>    lint the last answer in a Claude Code transcript
  enlint fix <file|->              apply free fixes, write a rewrite brief
  enlint verify <before> <after>   score a rewrite against the original
  enlint guide [name]              print a style guide (compact|words|sentences|document|all)
  enlint rules                     list every rule
  enlint log [n]                   show the last n background rewrites (default 20)

Options
  --json            machine-readable output
  --summary         one line only
  --strict          exit 1 when anything is flagged
  --off a,b         switch rules off
  --no-shape        skip the bold-lead-in rule
  --write           save the fixes needing no judgement back into the file (fix)
  --out <path>      where the rewriter should write (fix)
  --brief <path>    where to write the brief (fix)
  --min-issues <n>  say nothing below this count (check --summary)
  --min-words <n>   say nothing for passages shorter than this`;

type Args = {
  command: string;
  positional: string[];
  flag: (name: string) => boolean;
  value: (name: string) => string | undefined;
  number: (name: string, fallback: number) => number;
};

const parse = (argv: string[]): Args => {
  const flags = argv.filter((one) => one.startsWith("--"));
  const positional = argv.filter(
    (one, index) =>
      !one.startsWith("--") &&
      !(index > 0 && argv[index - 1].startsWith("--") && takesValue(argv[index - 1])),
  );

  const value = (name: string) => {
    const at = argv.indexOf(`--${name}`);
    return at === -1 ? undefined : argv[at + 1];
  };

  return {
    command: positional[0] ?? "",
    positional: positional.slice(1),
    flag: (name) => flags.includes(`--${name}`),
    value,
    number: (name, fallback) => {
      const given = value(name);
      return given == null ? fallback : Number(given);
    },
  };
};

const VALUED = new Set([
  "--off",
  "--out",
  "--brief",
  "--transcript",
  "--min-issues",
  "--min-words",
  "--words",
]);

function takesValue(flag: string) {
  return VALUED.has(flag);
}

const readStdin = async () => {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }

  return Buffer.concat(chunks).toString("utf8");
};

const sourceFrom = async (given: string | undefined) => {
  if (given == null || given === "") {
    throw new Error("Nothing to read. Pass a file path, or - for stdin.");
  }

  return given === "-" ? readStdin() : readFile(resolve(given), "utf8");
};

const configFrom = (args: Args) => {
  const off = (args.value("off") ?? "")
    .split(",")
    .map((one) => one.trim())
    .filter((one) => one !== "");
  const { config, unknown } = configure(off);
  if (unknown !== "") {
    throw new Error(unknown);
  }

  return { config: off.length === 0 ? editorial : config, off };
};

const findingsFor = (source: string, args: Args): Finding[] => {
  const { config } = configFrom(args);
  return allProblems(source, config, { shape: !args.flag("no-shape") });
};

const asJson = (source: string, findings: Finding[]) =>
  JSON.stringify(
    {
      words: wordsIn(source),
      count: findings.length,
      findings,
    },
    null,
    2,
  );

const guidePath = (name: string) =>
  fileURLToPath(new URL(`../style/${name}.md`, import.meta.url));

const GUIDES = ["compact", "words", "sentences", "document"];

const readGuide = (name: string) => readFile(guidePath(name), "utf8");

const runGuide = async (args: Args) => {
  const name = args.positional[0] ?? "compact";
  if (name === "all") {
    const parts = await Promise.all(
      ["document", "sentences", "words"].map(readGuide),
    );
    process.stdout.write(`${parts.join("\n\n")}\n`);
    return 0;
  }

  if (!GUIDES.includes(name)) {
    throw new Error(`No guide named "${name}". Try: ${GUIDES.join(", ")}, all`);
  }

  process.stdout.write(`${await readGuide(name)}\n`);
  return 0;
};

const quietEnough = (source: string, findings: Finding[], args: Args) =>
  findings.length < args.number("min-issues", 1) ||
  wordsIn(source) < args.number("min-words", 0);

const runCheck = async (args: Args) => {
  const transcript = args.value("transcript");
  const label = transcript ?? args.positional[0] ?? "-";
  const source =
    transcript == null
      ? await sourceFrom(args.positional[0])
      : await finalAnswerOf(resolve(transcript));

  const findings = findingsFor(source, args);

  if (args.flag("json")) {
    process.stdout.write(`${asJson(source, findings)}\n`);
    return args.flag("strict") && findings.length > 0 ? 1 : 0;
  }

  if (args.flag("summary")) {
    if (!quietEnough(source, findings, args)) {
      process.stdout.write(`${summary(source, findings)}\n`);
    }

    return args.flag("strict") && findings.length > 0 ? 1 : 0;
  }

  process.stdout.write(
    `${header(source, findings, basename(label))}\n${
      findings.length === 0
        ? "  clean\n"
        : `${listing(source, findings)}\n\n${summary(source, findings)}\n`
    }`,
  );
  return args.flag("strict") && findings.length > 0 ? 1 : 0;
};

const workDir = async () => mkdtemp(join(tmpdir(), "enlint-"));

const runFix = async (args: Args) => {
  const given = args.positional[0];
  const label = given ?? "-";
  const source = await sourceFrom(given);
  const { config } = configFrom(args);

  const { text, swaps } = mechanically(source, config);
  const findings = allProblems(text, config, { shape: !args.flag("no-shape") });

  const saveable = args.flag("write") && given != null && given !== "-";
  if (saveable && swaps.length > 0) {
    await writeFile(resolve(given), text, "utf8");
  }

  const saved = saveable && swaps.length > 0 ? `, saved to ${given}` : "";

  if (findings.length === 0) {
    process.stdout.write(
      `clean: ${wordsIn(text)} words, nothing flagged${
        swaps.length > 0
          ? ` (${swaps.length} punctuation ${
              swaps.length === 1 ? "swap" : "swaps"
            } applied${saved})`
          : ""
      }\n`,
    );
    return 0;
  }

  const dir = await workDir();
  const stem = basename(label).replace(/\.[^.]+$/u, "") || "passage";
  const outPath = args.value("out") ?? join(dir, `${stem}.rewritten.md`);
  const briefPath = args.value("brief") ?? join(dir, `${stem}.brief.md`);

  await writeFile(
    briefPath,
    brief({ source: text, findings, outPath, label: basename(label) }),
    "utf8",
  );

  const swapped =
    swaps.length > 0
      ? `\n${swaps.length} punctuation ${
          swaps.length === 1 ? "swap" : "swaps"
        } already applied${saved}.`
      : "";

  process.stdout.write(
    `${summary(text, findings)}${swapped}\nbrief: ${briefPath}\nwrite: ${outPath}\n`,
  );
  return 0;
};

const runVerify = async (args: Args) => {
  const [before, after] = args.positional;
  if (before == null || after == null) {
    throw new Error("Usage: enlint verify <before> <after>");
  }

  const { config } = configFrom(args);
  const shape = !args.flag("no-shape");
  const was = await readFile(resolve(before), "utf8");
  const now = await readFile(resolve(after), "utf8");

  const verdict = verdictOf(
    allProblems(was, config, { shape }),
    allProblems(now, config, { shape }),
  );

  if (args.flag("json")) {
    process.stdout.write(`${JSON.stringify(verdict, null, 2)}\n`);
    return verdict.survived + verdict.introduced > 0 ? 1 : 0;
  }

  const shrank = wordsIn(now) < wordsIn(was) / 2;
  process.stdout.write(
    `${describeVerdict(verdict)}; ${wordsIn(was)} -> ${wordsIn(now)} words${
      shrank ? "  WARNING: most of the passage is missing" : ""
    }\n`,
  );
  return verdict.survived + verdict.introduced > 0 ? 1 : 0;
};

const runRules = async () => {
  process.stdout.write(`${allRules().join("\n")}\n`);
  return 0;
};

const readHistory = async () => {
  try {
    return await readFile(historyPath(), "utf8");
  } catch {
    return "";
  }
};

type Entry = { at: string; path: string; applied: boolean; why: string; cleared: number; survived: number; introduced: number; cost: number; via?: string };

const historyLine = (entry: Entry) =>
  `${entry.at.slice(0, 19).replace("T", " ")}  ${entry.applied ? "applied" : "kept   "}  ${entry.path}  cleared ${entry.cleared}, survived ${entry.survived}, introduced ${entry.introduced}, ${entry.via === "codex" ? "via Codex" : `$${entry.cost.toFixed(4)}`}${entry.applied ? "" : `  (${entry.why})`}`;

const runLog = async (args: Args) => {
  const count = Number(args.positional[0] ?? 20) || 20;
  const entries = (await readHistory())
    .split("\n")
    .filter((line) => line.trim() !== "")
    .slice(-count)
    .map((line) => historyLine(JSON.parse(line) as Entry));
  process.stdout.write(entries.length === 0 ? "no background rewrites yet\n" : `${entries.join("\n")}\n`);
  return 0;
};

const COMMANDS: Record<string, (args: Args) => Promise<number>> = {
  log: runLog,
  check: runCheck,
  fix: runFix,
  verify: runVerify,
  guide: runGuide,
  rules: runRules,
};

export const main = async (argv: string[]): Promise<number> => {
  const args = parse(argv);
  const run = COMMANDS[args.command];
  if (run == null || args.flag("help")) {
    process.stdout.write(`${USAGE}\n`);
    return run == null && args.command !== "" ? 1 : 0;
  }

  return run(args);
};

export { density };

export { codexBinary } from "./rewriter.js";
