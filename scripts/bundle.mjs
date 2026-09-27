import { copyFile, mkdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "bundle");
const nlpData = join(root, "node_modules", "nlp", "data");

await rm(out, { recursive: true, force: true });

await build({
  entryPoints: {
    cli: join(root, "src", "cli.ts"),
    stop: join(root, "src", "stop.ts"),
    record: join(root, "src", "record.ts"),
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

process.stdout.write(`Bundled the plugin into ${out}\n`);
