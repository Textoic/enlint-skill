import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const readStdin = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
};

const main = async () => {
  if (process.env.ENLINT_DISABLE === "1" || process.env.ENLINT_DOCUMENTS === "0") {
    return;
  }

  const payload = JSON.parse((await readStdin()) || "{}");
  const { afterWrite } = await import(pathToFileURL(join(root, "bundle", "record.mjs")).href);
  await afterWrite(payload);
};

main().then(
  () => {
    process.exitCode = 0;
  },
  (error) => {
    if (process.env.ENLINT_DEBUG === "1") {
      process.stderr.write(`enlint write hook skipped: ${error.stack}\n`);
    }

    process.exitCode = 0;
  },
);
