import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { Job } from "../src/background.js";
import { atPrompt } from "../src/feedback.js";
import { patchEvents } from "../src/patch.js";
import { eventsFor } from "../src/record.js";
import { atStop } from "../src/stop.js";
import { createdDuring } from "../src/turns.js";

const limits = { words: 60, issues: 3, notifyOnly: false };

const BAD = `The optimization of the serialization of the payload was performed by the platform team, enabling downstream consumers to scale. This is not just a performance improvement, but also a correctness fix. The report that the analyst who the board hired drafted was circulated, highlighting the need for a more nuanced approach. It is not uncommon for the system to delve into edge cases.
`;

test("reads a new file and each run of added lines out of a patch", () => {
  const cwd = join(tmpdir(), "project");
  const patch = [
    "*** Begin Patch",
    "*** Add File: guide.md",
    "+First line.",
    "*** Update File: notes.md",
    "@@",
    " kept",
    "+added one",
    "+added two",
    "-removed",
    "+added three",
    "*** End Patch",
  ].join("\n");

  assert.deepEqual(patchEvents(patch, cwd), [
    { kind: "wrote", path: join(cwd, "guide.md") },
    { kind: "edited", path: join(cwd, "notes.md"), text: "added one\nadded two" },
    { kind: "edited", path: join(cwd, "notes.md"), text: "added three" },
  ]);
});

test("records Codex patches to prose files only", () => {
  const cwd = join(tmpdir(), "project");
  const command = "*** Begin Patch\n*** Add File: plan.md\n+Hi.\n*** Add File: src/app.ts\n+x\n*** End Patch";
  assert.deepEqual(eventsFor({ tool_name: "apply_patch", cwd, tool_input: { command } }), [
    { kind: "wrote", path: join(cwd, "plan.md") },
  ]);
});

test("finds prose files created during the turn, skipping hidden and vendored folders", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "prose-turn-"));
  const at = Date.now();
  await writeFile(join(cwd, "fresh.md"), "x", "utf8");
  await writeFile(join(cwd, "code.ts"), "x", "utf8");
  const found = await createdDuring({ at, cwd });
  assert.deepEqual(found, [join(cwd, "fresh.md")]);
  assert.deepEqual(await createdDuring({ at: Date.now() + 60_000, cwd }), []);
});

test("sends a document written through the shell to the background", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "prose-turn-"));
  const session = `test-shell-${Date.now()}`;
  await atPrompt({ session_id: session, cwd }, { notes: true, turns: true });
  await writeFile(join(cwd, "notes.md"), BAD, "utf8");

  const launched: Job[] = [];
  await atStop({ session_id: session, cwd }, limits, async (job) => {
    launched.push(job);
  });
  assert.deepEqual(launched, [{ items: [{ kind: "file", path: join(cwd, "notes.md"), source: BAD }] }]);
});
