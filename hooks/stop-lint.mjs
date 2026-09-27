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

const number = (name, fallback) => {
  const given = Number(process.env[name]);
  return Number.isFinite(given) && given > 0 ? given : fallback;
};

const limits = () => ({
  words: number("ENLINT_MIN_WORDS", 60),
  issues: number("ENLINT_MIN_ISSUES", 3),
  notifyOnly: process.env.ENLINT_MODE === "notify",
});

const main = async () => {
  if (process.env.ENLINT_DISABLE === "1") {
    return;
  }

  const payload = JSON.parse((await readStdin()) || "{}");
  const { atStop } = await import(pathToFileURL(join(root, "bundle", "stop.mjs")).href);
  const reply = await atStop(payload, limits());
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
      process.stderr.write(`enlint stop hook skipped: ${error.stack}\n`);
    }

    process.exitCode = 0;
  },
);
