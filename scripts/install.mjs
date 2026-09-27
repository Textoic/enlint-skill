import { spawnSync } from "node:child_process";
import { access, readdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const BEGIN = "# enlint:begin";

const END = "# enlint:end";

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
  node scripts/install.mjs codex           put the style card in Codex's developer instructions
                                          and print the commands that install the plugin`;

const installedCopy = async () => {
  try {
    const listed = JSON.parse(
      await readFile(join(homedir(), ".claude", "plugins", "installed_plugins.json"), "utf8"),
    );
    const key = Object.keys(listed.plugins ?? {}).find((name) => name.startsWith("enlint@"));
    return key == null ? "" : (listed.plugins[key][0]?.installPath ?? "");
  } catch {
    return "";
  }
};

const lintsFrom = (folder) => {
  const run = spawnSync(process.execPath, [join(folder, "bin", "enlint.mjs"), "check", "-", "--summary"], {
    input: "We should delve into the problem.",
    encoding: "utf8",
  });
  return run.status === 0 && run.stdout.includes("style issue");
};

const installedCheck = async () => {
  const folder = await installedCopy();
  return folder === ""
    ? ["installed in Claude Code (not installed, skipped)", true]
    : [`installed copy lints (${folder})`, lintsFrom(folder)];
};

const codexHome = () => process.env.CODEX_HOME || join(homedir(), ".codex");

const codexCopy = async () => {
  const folder = join(codexHome(), "plugins", "cache", "enlint-local", "enlint");
  try {
    const versions = (await readdir(folder)).sort();
    return versions.length === 0 ? "" : join(folder, versions[versions.length - 1]);
  } catch {
    return "";
  }
};

const codexChecks = async () => {
  const folder = await codexCopy();
  if (folder === "") {
    return [["installed in Codex (not installed, skipped)", true]];
  }

  const config = (await exists(join(codexHome(), "config.toml")))
    ? await readFile(join(codexHome(), "config.toml"), "utf8")
    : "";
  return [
    [`Codex copy lints (${folder})`, lintsFrom(folder)],
    ["Codex developer_instructions carry the card", config.includes(BEGIN)],
  ];
};

const doctor = async () => {
  const checks = [
    ["dist built", await exists(join(root, "dist", "cli.js"))],
    ["bundle built", await exists(join(root, "bundle", "cli.mjs"))],
    ["bundle carries the dictionary", await exists(join(root, "bundle", "data", "dictionary.json"))],
    ["this checkout lints", lintsFrom(root)],
    ["english-lint linked", await exists(join(root, "node_modules", "english-lint", "dist", "index.js"))],
    ["nlp linked", await exists(join(root, "node_modules", "nlp", "dist", "index.js"))],
    ["dictionary present", await exists(join(root, "node_modules", "nlp", "data", "dictionary.json"))],
    ["style guides present", await exists(join(root, "style", "compact.md"))],
    await installedCheck(),
    ...(await codexChecks()),
  ];

  checks.forEach(([label, ok]) => {
    process.stdout.write(`${ok ? "ok  " : "MISSING  "}${label}\n`);
  });

  const failed = checks.filter(([, ok]) => !ok);
  if (failed.length > 0) {
    process.stdout.write(
      "\nRun `npm install` then `npm run build` here, and `npm run build` in ../english-lint and ../nlp.\nIf only the installed copy fails, bump the version in .claude-plugin/plugin.json, then run\n/plugin marketplace update enlint-local and /plugin update enlint@enlint-local in Claude Code.\n",
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

To pick up a rebuild later, bump the version in .claude-plugin/plugin.json and run:

  /plugin marketplace update enlint-local
  /plugin update enlint@enlint-local
`,
  );
  return 0;
};

const codexConfig = () => join(process.env.CODEX_HOME || join(homedir(), ".codex"), "config.toml");

const TOML_QUOTE = "'''";

const blockFor = async () => {
  const card = (await readFile(join(root, "style", "compact.md"), "utf8")).trim();
  if (card.includes(TOML_QUOTE)) {
    throw new Error(`The style card contains ${TOML_QUOTE} and cannot sit in a TOML literal string.`);
  }

  return `${BEGIN}\ndeveloper_instructions = ${TOML_QUOTE}\n${card}\n${TOML_QUOTE}\n${END}`;
};

const withoutBlock = (text) => {
  const from = text.indexOf(BEGIN);
  const to = text.indexOf(END);
  return from === -1 || to === -1
    ? text
    : `${text.slice(0, from)}${text.slice(to + END.length)}`.replace(/^\n+/u, "");
};

const hasOtherInstructions = (text) => /^developer_instructions\s*=/mu.test(text);

const codexSteps = (path) => `Wrote the style card into developer_instructions in ${path}
(the previous file is saved beside it as config.toml.enlint-backup).

Now install the plugin that lints and rewrites:

  codex plugin marketplace add ${root.split("\\").join("/")}
  codex plugin add enlint@enlint-local

Then start Codex, run /hooks, and approve the three enlint hooks. Codex runs a
plugin's hooks only after you review them once.
`;

const codex = async () => {
  const path = codexConfig();
  const held = (await exists(path)) ? await readFile(path, "utf8") : "";
  const kept = withoutBlock(held);
  if (hasOtherInstructions(kept)) {
    process.stderr.write(`${path} already sets developer_instructions. Add the card from style/compact.md to it by hand.\n`);
    return 1;
  }

  if (held !== "") {
    await writeFile(`${path}.enlint-backup`, held, "utf8");
  }

  await writeFile(path, `${await blockFor()}\n${kept}`, "utf8");
  process.stdout.write(codexSteps(path));
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
