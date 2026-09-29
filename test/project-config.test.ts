import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { everyRule } from "../src/config.js";
import { proseProblems } from "../src/lint.js";
import {
  projectConfigFrom,
  withProjectConfig,
} from "../src/project-config.js";

test("a project config switches rules off and ignores cases", () => {
  const config = withProjectConfig(everyRule, {
    rules: {
      "no-passive-sentences": "off",
      "no-explained-intensifiers": ["warn", { ignore: ["dirty"] }],
      "no-similes": "error",
    },
  });
  assert.equal(config["no-passive-sentences"], false);
  assert.equal(config["no-similes"], true);
  assert.deepEqual(
    proseProblems("The room was very dirty and the food was very bad.", config).map(
      ({ case: key }) => key,
    ),
    ["bad"],
  );
});

test("no project config leaves the house style alone", () => {
  assert.deepEqual(withProjectConfig(everyRule, undefined), {
    ...everyRule,
    ignore: {},
  });
});

test("the nearest textoic.config.json above the folder wins", async () => {
  const root = await mkdtemp(join(tmpdir(), "textoic-skill-"));
  const nested = join(root, "docs", "notes");
  await mkdir(nested, { recursive: true });
  await writeFile(
    join(root, "textoic.config.json"),
    JSON.stringify({ rules: { "no-similes": "off" } }),
  );
  assert.deepEqual(projectConfigFrom(nested), {
    rules: { "no-similes": "off" },
  });
});

test("a config that is not JSON is skipped", async () => {
  const root = await mkdtemp(join(tmpdir(), "textoic-skill-"));
  await writeFile(join(root, ".textoicrc.json"), "{ not json");
  assert.equal(projectConfigFrom(root), undefined);
});
