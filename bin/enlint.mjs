#!/usr/bin/env node
import { main } from "../bundle/cli.mjs";

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  },
);
