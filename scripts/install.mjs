import { access, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const BEGIN = "<!-- enlint:begin -->";

const END = "<!-- enlint:end -->";

const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const usage = `Usage:
  node scripts/install.mjs doctor          check that everything needed is in place
  node scripts/install.mjs claude          print the commands that install the plugin
  node scripts/install.mjs codex <dir>     write the style block into <dir>/AGENTS.md`;

const doctor = async () => {
  const checks = [
    ["dist built", await exists(join(root, "dist", "cli.js"))],
    ["english-lint linked", await exists(join(root, "node_modules", "english-lint", "dist", "index.js"))],
    ["nlp linked", await exists(join(root, "node_modules", "nlp", "dist", "index.js"))],
    ["dictionary present", await exists(join(root, "node_modules", "nlp", "data", "dictionary.json"))],
    ["style guides present", await exists(join(root, "style", "compact.md"))],
  ];

  checks.forEach(([label, ok]) => {
    process.stdout.write(`${ok ? "ok  " : "MISSING  "}${label}\n`);
  });

  const failed = checks.filter(([, ok]) => !ok);
  if (failed.length > 0) {
    process.stdout.write(
      "\nRun `npm install` then `npm run build` here, and `npm run build` in ../english-lint and ../nlp.\n",
    );
    return 1;
  }

  process.stdout.write("\nEverything is in place.\n");
  return 0;
};

const claude = async () => {
  process.stdout.write(
    `Run these two commands inside Claude Code:

  /plugin marketplace add ${root.split("\\").join("/")}
  /plugin install enlint@enlint-local

Then restart Claude Code. Hooks only load at session start.
`,
  );
  return 0;
};

const blockFor = async () => {
  const card = await readFile(join(root, "codex", "AGENTS.md"), "utf8");
  const path = root.split("\\").join("/");
  return `${BEGIN}\n${card.trim().split("ENLINT/").join(`${path}/`)}\n${END}`;
};

const withoutBlock = (text) => {
  const from = text.indexOf(BEGIN);
  const to = text.indexOf(END);
  return from === -1 || to === -1
    ? text
    : `${text.slice(0, from)}${text.slice(to + END.length)}`;
};

const codex = async (target) => {
  if (target == null) {
    process.stderr.write(`${usage}\n`);
    return 1;
  }

  const path = join(resolve(target), "AGENTS.md");
  const held = (await exists(path)) ? await readFile(path, "utf8") : "";
  const kept = withoutBlock(held).replace(/\n{3,}$/u, "\n").trimEnd();
  const block = await blockFor();

  await writeFile(path, `${kept === "" ? "" : `${kept}\n\n`}${block}\n`, "utf8");
  process.stdout.write(`Wrote the enlint block into ${path}\n`);
  return 0;
};

const COMMANDS = { doctor, claude, codex };

const [, , command, target] = process.argv;
const run = COMMANDS[command];

if (run == null) {
  process.stderr.write(`${usage}\n`);
  process.exitCode = 1;
} else {
  process.exitCode = await run(target);
}
