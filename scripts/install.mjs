import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { access, readdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
                                          and install the plugin into Codex`;

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

const foldersIn = async (folder) => {
  try {
    return (await readdir(folder)).map((name) => join(folder, name));
  } catch {
    return [];
  }
};

const codexCopy = async () => {
  const marketplaces = await foldersIn(join(codexHome(), "plugins", "cache"));
  const copies = (await Promise.all(marketplaces.map((market) => foldersIn(join(market, "enlint"))))).flat();
  const runnable = copies.filter((copy) => existsSync(join(copy, "bin", "enlint.mjs")));
  return runnable.sort((one, other) => statSync(other).mtimeMs - statSync(one).mtimeMs)[0] ?? "";
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
    ["@textoic/enlint installed", await exists(join(root, "node_modules", "@textoic", "enlint", "dist", "index.js"))],
    ["@textoic/artisan installed", await exists(join(root, "node_modules", "@textoic", "artisan", "dist", "index.js"))],
    ["dictionary present", await exists(join(root, "node_modules", "@textoic", "artisan", "data", "dictionary.json"))],
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
      "\nRun `npm install` then `npm run build` here.\nIf only the installed copy fails, bump the version in .claude-plugin/plugin.json, then run\n/plugin marketplace update textoic-skill and /plugin update enlint@textoic-skill in Claude Code.\n",
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
  /plugin install enlint@textoic-skill

Then restart Claude Code. Hooks only load at session start.

To pick up a rebuild later, bump the version in .claude-plugin/plugin.json and run:

  /plugin marketplace update textoic-skill
  /plugin update enlint@textoic-skill
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

const marketplaceRoot = () => root.split("\\").join("/");

const codexCli = async () => {
  try {
    const { codexBinary } = await import(pathToFileURL(join(root, "bundle", "cli.mjs")).href);
    return codexBinary();
  } catch {
    return "codex";
  }
};

const runCodex = (binary, args) => {
  const result = spawnSync(binary, args, { encoding: "utf8", windowsHide: true });
  process.stdout.write(`${`${result.stdout ?? ""}${result.stderr ?? ""}`.trim()}\n`);
  return result.status === 0;
};

const installPlugin = async () => {
  const binary = await codexCli();
  process.stdout.write(`\nInstalling the plugin with ${binary}\n`);
  return (
    runCodex(binary, ["plugin", "marketplace", "add", marketplaceRoot()]) &&
    runCodex(binary, ["plugin", "add", "enlint@textoic-skill"])
  );
};

const HOOKS_STEP = `
Last step: open Codex (the ChatGPT app's Codex tab, or the Codex CLI), run
/hooks, and approve the four enlint hooks. Codex runs a plugin's hooks only
after you review them once.
`;

const manualSteps = `
Could not find the Codex CLI. It ships inside the ChatGPT app at
%LOCALAPPDATA%\\OpenAI\\Codex\\bin\\<version>\\codex.exe; set ENLINT_CODEX to its path
and run this again, or run these two commands with that path:

  codex plugin marketplace add ${root.split("\\").join("/")}
  codex plugin add enlint@textoic-skill
`;

const codex = async () => {
  const path = codexConfig();
  const held = (await exists(path)) ? await readFile(path, "utf8") : "";
  const kept = withoutBlock(held);
  if (hasOtherInstructions(kept)) {
    process.stderr.write(`${path} already sets developer_instructions. Add the card from style/compact.md to it by hand.\n`);
    return 1;
  }

  if (held !== "" && !held.includes(BEGIN)) {
    await writeFile(`${path}.enlint-backup`, held, "utf8");
  }

  await writeFile(path, `${await blockFor()}\n${kept}`, "utf8");
  process.stdout.write(`Wrote the style card into developer_instructions in ${path}\n(the previous file is saved beside it as config.toml.enlint-backup).\n`);
  const installed = await installPlugin();
  process.stdout.write(installed ? HOOKS_STEP : manualSteps);
  return installed ? 0 : 1;
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
