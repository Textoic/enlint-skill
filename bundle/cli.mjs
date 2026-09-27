import {
  ErrorId,
  allProblems,
  allRules,
  configure,
  density,
  editorial,
  finalAnswerOf,
  grouped,
  header,
  listing,
  place,
  proseProblems,
  sentences,
  spanOf,
  summary,
  wordsIn
} from "./chunk-UUAUWUB3.mjs";
import "./chunk-R7POPVJR.mjs";

// src/cli.ts
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// src/mechanical.ts
var DETERMINISTIC = [ErrorId.NO_SPECIAL_PUNCTUATION];
var swapFor = (error) => {
  const [offered] = error.suggestions ?? [];
  if (offered == null || offered.text === "") {
    return null;
  }
  const [start, end] = offered.range;
  return { start, end, replacement: offered.text, ruleId: error.id };
};
var overlaps = (one, other) => one.start < other.end && other.start < one.end;
var settled = (swaps) => [...swaps].sort((one, other) => one.start - other.start || one.end - other.end).reduce(
  (kept, swap) => kept.some((keeper) => overlaps(keeper, swap)) ? kept : [...kept, swap],
  []
);
var applied = (source, swaps) => settled(swaps).slice().reverse().reduce(
  (text, { start, end, replacement }) => text.slice(0, start) + replacement + text.slice(end),
  source
);
var swapsFor = (source, config) => settled(
  proseProblems(source, config).filter(({ id }) => DETERMINISTIC.includes(id)).flatMap((error) => {
    const swap = swapFor(error);
    return swap == null ? [] : [swap];
  })
);
var mechanically = (source, config) => {
  const swaps = swapsFor(source, config);
  return { text: applied(source, swaps), swaps };
};

// src/verify.ts
var countsOf = (errors) => errors.reduce(
  (counts, { id }) => counts.set(id, (counts.get(id) ?? 0) + 1),
  /* @__PURE__ */ new Map()
);
var ruleIdsIn = (before, after) => [
  ...new Set([...before, ...after].map(({ id }) => id))
];
var talliesFor = (before, after) => {
  const was = countsOf(before);
  const now = countsOf(after);
  return ruleIdsIn(before, after).map((ruleId) => ({
    ruleId,
    before: was.get(ruleId) ?? 0,
    after: now.get(ruleId) ?? 0
  })).sort(
    (one, other) => other.before - one.before || (one.ruleId < other.ruleId ? -1 : 1)
  );
};
var summed = (tallies, of) => tallies.reduce((total, tally) => total + of(tally), 0);
var verdictOf = (before, after) => {
  const byRule = talliesFor(before, after);
  return {
    asked: before.length,
    cleared: summed(
      byRule,
      ({ before: was, after: now }) => Math.max(was - now, 0)
    ),
    survived: summed(
      byRule,
      ({ before: was, after: now }) => Math.min(was, now)
    ),
    introduced: summed(
      byRule,
      ({ before: was, after: now }) => Math.max(now - was, 0)
    ),
    byRule
  };
};
var shortfall = ({ survived, introduced }) => [
  survived > 0 ? `${survived} still flagged` : "",
  introduced > 0 ? `${introduced} newly flagged` : ""
].filter((part) => part !== "");
var describeVerdict = (verdict) => {
  const missed = shortfall(verdict);
  return missed.length === 0 ? `cleared all ${verdict.asked}` : `cleared ${verdict.cleared} of ${verdict.asked}, ${missed.join(", ")}`;
};
var mean = (numbers) => numbers.length === 0 ? 0 : numbers.reduce((total, one) => total + one, 0) / numbers.length;
var sentenceLengths = (text) => sentences(text).map((tokens) => tokens.filter(({ xpos }) => xpos !== "PUNCT").length).filter((length) => length > 0);
var sentenceProfile = (text) => {
  const lengths = sentenceLengths(text);
  return {
    count: lengths.length,
    average: Math.round(mean(lengths)),
    longest: Math.max(0, ...lengths)
  };
};

// src/brief.ts
var HEADINGS = {
  shape: "Pass 1 - shape of the passage",
  sentences: "Pass 2 - how sentences are built",
  words: "Pass 3 - word choice"
};
var ORDER = ["shape", "sentences", "words"];
var swapsOffered = (finding) => (finding.suggestions ?? []).filter(
  ({ range: [from, to] }) => from === finding.start && to === finding.end
).map(({ text }) => text).filter((text) => text !== "");
var shapeLine = (source, finding) => {
  const { line } = place(source, finding.start);
  return `- line ${line}: ${finding.message}`;
};
var proseLine = (source, finding) => {
  const { line } = place(source, finding.start);
  const swaps = swapsOffered(finding);
  const offered = swaps.length === 0 ? "" : `
  Replacements the rule offers, any of which you may use: ${swaps.join(
    ", "
  )}`;
  return `- line ${line}, "${spanOf(source, finding)}" \u2014 ${finding.message}${offered}`;
};
var section = (source, scope, found) => `### ${HEADINGS[scope]} (${found.length})

${found.map(
  (finding) => scope === "shape" ? shapeLine(source, finding) : proseLine(source, finding)
).join("\n")}`;
var rhythm = (source) => {
  const { count, average, longest } = sentenceProfile(source);
  return count < 2 ? "" : `The passage runs ${count} sentences, averaging ${average} words, longest ${longest}. Hand back one with the same shape: about ${count} sentences, not twice that, and the same spread between longest and shortest. A run of ${count * 2} short sentences all the same size is a failed edit however many flags it clears.`;
};
var brief = ({
  source,
  findings,
  outPath,
  label
}) => {
  const by = grouped(findings);
  const sections = ORDER.filter(
    (scope) => (by.get(scope) ?? []).length > 0
  ).map((scope) => section(source, scope, by.get(scope)));
  return `# Rewrite brief

Source: ${label} \u2014 ${wordsIn(source)} words, ${findings.length} flagged.

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

// src/cli.ts
var USAGE = `enlint - lint and rewrite English prose with english-lint

  enlint check <file|->            list the style problems in a file
  enlint check --transcript <p>    lint the last answer in a Claude Code transcript
  enlint fix <file|->              apply free fixes, write a rewrite brief
  enlint verify <before> <after>   score a rewrite against the original
  enlint guide [name]              print a style guide (compact|words|sentences|document|all)
  enlint rules                     list every rule

Options
  --json            machine-readable output
  --summary         one line only
  --strict          exit 1 when anything is flagged
  --off a,b         switch rules off
  --no-shape        skip the list and bold-lead-in rules
  --write           save the fixes needing no judgement back into the file (fix)
  --out <path>      where the rewriter should write (fix)
  --brief <path>    where to write the brief (fix)
  --min-issues <n>  say nothing below this count (check --summary)
  --min-words <n>   say nothing for passages shorter than this`;
var parse = (argv) => {
  const flags = argv.filter((one) => one.startsWith("--"));
  const positional = argv.filter(
    (one, index) => !one.startsWith("--") && !(index > 0 && argv[index - 1].startsWith("--") && takesValue(argv[index - 1]))
  );
  const value = (name) => {
    const at = argv.indexOf(`--${name}`);
    return at === -1 ? void 0 : argv[at + 1];
  };
  return {
    command: positional[0] ?? "",
    positional: positional.slice(1),
    flag: (name) => flags.includes(`--${name}`),
    value,
    number: (name, fallback) => {
      const given = value(name);
      return given == null ? fallback : Number(given);
    }
  };
};
var VALUED = /* @__PURE__ */ new Set([
  "--off",
  "--out",
  "--brief",
  "--transcript",
  "--min-issues",
  "--min-words",
  "--words"
]);
function takesValue(flag) {
  return VALUED.has(flag);
}
var readStdin = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
};
var sourceFrom = async (given) => {
  if (given == null || given === "") {
    throw new Error("Nothing to read. Pass a file path, or - for stdin.");
  }
  return given === "-" ? readStdin() : readFile(resolve(given), "utf8");
};
var configFrom = (args) => {
  const off = (args.value("off") ?? "").split(",").map((one) => one.trim()).filter((one) => one !== "");
  const { config, unknown } = configure(off);
  if (unknown !== "") {
    throw new Error(unknown);
  }
  return { config: off.length === 0 ? editorial : config, off };
};
var findingsFor = (source, args) => {
  const { config } = configFrom(args);
  return allProblems(source, config, { shape: !args.flag("no-shape") });
};
var asJson = (source, findings) => JSON.stringify(
  {
    words: wordsIn(source),
    count: findings.length,
    findings
  },
  null,
  2
);
var guidePath = (name) => fileURLToPath(new URL(`../style/${name}.md`, import.meta.url));
var GUIDES = ["compact", "words", "sentences", "document"];
var readGuide = (name) => readFile(guidePath(name), "utf8");
var runGuide = async (args) => {
  const name = args.positional[0] ?? "compact";
  if (name === "all") {
    const parts = await Promise.all(
      ["document", "sentences", "words"].map(readGuide)
    );
    process.stdout.write(`${parts.join("\n\n")}
`);
    return 0;
  }
  if (!GUIDES.includes(name)) {
    throw new Error(`No guide named "${name}". Try: ${GUIDES.join(", ")}, all`);
  }
  process.stdout.write(`${await readGuide(name)}
`);
  return 0;
};
var quietEnough = (source, findings, args) => findings.length < args.number("min-issues", 1) || wordsIn(source) < args.number("min-words", 0);
var runCheck = async (args) => {
  const transcript = args.value("transcript");
  const label = transcript ?? args.positional[0] ?? "-";
  const source = transcript == null ? await sourceFrom(args.positional[0]) : await finalAnswerOf(resolve(transcript));
  const findings = findingsFor(source, args);
  if (args.flag("json")) {
    process.stdout.write(`${asJson(source, findings)}
`);
    return args.flag("strict") && findings.length > 0 ? 1 : 0;
  }
  if (args.flag("summary")) {
    if (!quietEnough(source, findings, args)) {
      process.stdout.write(`${summary(source, findings)}
`);
    }
    return args.flag("strict") && findings.length > 0 ? 1 : 0;
  }
  process.stdout.write(
    `${header(source, findings, basename(label))}
${findings.length === 0 ? "  clean\n" : `${listing(source, findings)}

${summary(source, findings)}
`}`
  );
  return args.flag("strict") && findings.length > 0 ? 1 : 0;
};
var workDir = async () => mkdtemp(join(tmpdir(), "enlint-"));
var runFix = async (args) => {
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
      `clean: ${wordsIn(text)} words, nothing flagged${swaps.length > 0 ? ` (${swaps.length} punctuation ${swaps.length === 1 ? "swap" : "swaps"} applied${saved})` : ""}
`
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
    "utf8"
  );
  const swapped = swaps.length > 0 ? `
${swaps.length} punctuation ${swaps.length === 1 ? "swap" : "swaps"} already applied${saved}.` : "";
  process.stdout.write(
    `${summary(text, findings)}${swapped}
brief: ${briefPath}
write: ${outPath}
`
  );
  return 0;
};
var runVerify = async (args) => {
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
    allProblems(now, config, { shape })
  );
  if (args.flag("json")) {
    process.stdout.write(`${JSON.stringify(verdict, null, 2)}
`);
    return verdict.survived + verdict.introduced > 0 ? 1 : 0;
  }
  const shrank = wordsIn(now) < wordsIn(was) / 2;
  process.stdout.write(
    `${describeVerdict(verdict)}; ${wordsIn(was)} -> ${wordsIn(now)} words${shrank ? "  WARNING: most of the passage is missing" : ""}
`
  );
  return verdict.survived + verdict.introduced > 0 ? 1 : 0;
};
var runRules = async () => {
  process.stdout.write(`${allRules().join("\n")}
`);
  return 0;
};
var COMMANDS = {
  check: runCheck,
  fix: runFix,
  verify: runVerify,
  guide: runGuide,
  rules: runRules
};
var main = async (argv) => {
  const args = parse(argv);
  const run = COMMANDS[args.command];
  if (run == null || args.flag("help")) {
    process.stdout.write(`${USAGE}
`);
    return run == null && args.command !== "" ? 1 : 0;
  }
  return run(args);
};
export {
  density,
  main
};
