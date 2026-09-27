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
  if (process.env.ENLINT_DISABLE === "1" || process.env.ENLINT_PROACTIVE === "0") {
    return;
  }

  const payload = JSON.parse((await readStdin()) || "{}");
  const { atSessionStart } = await import(pathToFileURL(join(root, "bundle", "session.mjs")).href);
  const reply = await atSessionStart(payload);
  if (reply != null) {
    process.stdout.write(`${JSON.stringify(reply)}\n`);
  }
};

main().then(
  () => {
    process.exitCode = 0;
  },
  (error) => {
    if (process.env.ENLINT_DEBUG === "1") {
      process.stderr.write(`enlint session hook skipped: ${error.stack}\n`);
    }

    process.exitCode = 0;
  },
);
