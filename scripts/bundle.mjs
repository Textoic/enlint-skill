import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "bundle");
const nlpData = join(root, "node_modules", "@textoic", "artisan", "data");

const STYLE_HEADER = `---
name: house-style
description: The enlint house style for any prose a person will read.
force-for-plugin: true
keep-coding-instructions: true
---

`;

await rm(out, { recursive: true, force: true });

await build({
  entryPoints: {
    cli: join(root, "src", "cli.ts"),
    stop: join(root, "src", "stop.ts"),
    record: join(root, "src", "record.ts"),
    worker: join(root, "src", "worker.ts"),
    feedback: join(root, "src", "feedback.ts"),
    session: join(root, "src", "session.ts"),
  },
  outdir: out,
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "node",
  target: "node20",
  outExtension: { ".js": ".mjs" },
  chunkNames: "chunk-[hash]",
  logLevel: "warning",
});

await mkdir(join(out, "data"), { recursive: true });
await Promise.all(
  ["dictionary.json", "weights.json"].map((name) =>
    copyFile(join(nlpData, name), join(out, "data", name)),
  ),
);

const card = await readFile(join(root, "style", "compact.md"), "utf8");
await mkdir(join(root, "output-styles"), { recursive: true });
await writeFile(join(root, "output-styles", "house-style.md"), `${STYLE_HEADER}${card.trim()}\n`, "utf8");

process.stdout.write(`Bundled the plugin into ${out}\n`);
