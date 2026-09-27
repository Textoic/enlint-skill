import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const main = async () => {
  const { workOn } = await import(pathToFileURL(join(root, "bundle", "worker.mjs")).href);
  await workOn(process.argv[2]);
};

main().then(
  () => {
    process.exitCode = 0;
  },
  () => {
    process.exitCode = 0;
  },
);
