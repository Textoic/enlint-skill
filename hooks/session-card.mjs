import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const main = async () => {
  if (process.env.ENLINT_PROACTIVE === "0" || process.env.ENLINT_DISABLE === "1") {
    return;
  }

  const card = await readFile(resolve(root, "style", "compact.md"), "utf8");
  process.stdout.write(`${card.trim()}\n`);
};

main().then(
  () => {
    process.exitCode = 0;
  },
  () => {
    process.exitCode = 0;
  },
);
