import assert from "node:assert/strict";
import { test } from "node:test";
import { editorial } from "../src/config.js";
import { wordsIn } from "../src/document.js";
import { allProblems, proseProblems } from "../src/lint.js";
import { mechanically } from "../src/mechanical.js";
import { brief } from "../src/brief.js";
import { place, summary } from "../src/report.js";
import { structureProblems } from "../src/structure.js";
import { finalAnswerIn } from "../src/transcript.js";
import { verdictOf } from "../src/verify.js";

test("finds bad words in plain prose", () => {
  const found = proseProblems("We should delve into the problem.", editorial);
  assert.ok(found.some(({ id }) => id === "no-bad-words"));
});

test("masks fenced code so no rule fires inside it", () => {
  const source = "Fine prose here.\n\n```js\nconst leverage = utilize(robust);\n```\n";
  assert.equal(allProblems(source, editorial).length, 0);
});

test("masks quoted words, which the author means exactly", () => {
  const source = "The rule treats \"delve\" and “leverage” as the whole story.";
  assert.equal(
    allProblems(source, editorial).filter(({ id }) => id === "no-bad-words").length,
    0,
  );
});

test("masks inline code and urls", () => {
  const source = "Read `delve into` and https://example.com/delve-into now.";
  assert.equal(
    allProblems(source, editorial).filter(({ id }) => id === "no-bad-words")
      .length,
    0,
  );
});

test("leaves lists alone, bold labels included", () => {
  assert.deepEqual(structureProblems("- one thing\n- **Two:** another thing\n1. a third\n"), []);
});

test("flags a bold lead-in only when it opens a paragraph", () => {
  const opening = structureProblems("**Overview:** the thing happened.\n");
  assert.equal(opening.length, 1);
  assert.equal(opening[0].id, "no-bold-lead-ins");

  const inline = structureProblems("The thing **Overview:** happened.\n");
  assert.equal(inline.length, 0);
});

test("ignores bold lead-ins inside a fence", () => {
  assert.equal(structureProblems("```\n**Overview:** not prose\n```\n").length, 0);
});

test("applies the em dash swap with no model", () => {
  const { text, swaps } = mechanically("The code — it works — is done.", editorial);
  assert.ok(swaps.length > 0);
  assert.ok(!text.includes("—"));
});

test("place reports one-based line and column", () => {
  assert.deepEqual(place("one\ntwo", 0), { line: 1, column: 1 });
  assert.deepEqual(place("one\ntwo", 4), { line: 2, column: 1 });
});

test("summary is one line and names each scope present", () => {
  const source = "**Report:** The report was written by the team.\n";
  const line = summary(source, allProblems(source, editorial));
  assert.equal(line.includes("\n"), false);
  assert.ok(line.includes("shape"));
});

test("summary is empty when nothing is flagged", () => {
  assert.equal(summary("Dogs bark.", []), "");
});

test("verdict counts cleared, survived and introduced", () => {
  const was = [
    { id: "no-bad-words", start: 0, end: 5, message: "" },
    { id: "no-bad-words", start: 6, end: 9, message: "" },
    { id: "no-similes", start: 0, end: 2, message: "" },
  ];
  const now = [{ id: "no-bad-words", start: 0, end: 5, message: "" }];
  const verdict = verdictOf(was, now);
  assert.equal(verdict.asked, 3);
  assert.equal(verdict.cleared, 2);
  assert.equal(verdict.survived, 1);
  assert.equal(verdict.introduced, 0);
});

const transcriptLines = (entries: unknown[]) =>
  entries.map((entry) => JSON.stringify(entry)).join("\n");

test("reads the final answer out of a transcript", () => {
  const raw = transcriptLines([
    { type: "user", message: { role: "user", content: "first question" } },
    {
      type: "assistant",
      message: { role: "assistant", content: [{ type: "text", text: "old answer" }] },
    },
    { type: "user", message: { role: "user", content: "second question" } },
    {
      type: "assistant",
      message: { role: "assistant", content: [{ type: "text", text: "new answer" }] },
    },
  ]);
  assert.equal(finalAnswerIn(raw), "new answer");
});

test("reads only the text after the last tool call", () => {
  const raw = transcriptLines([
    { type: "user", message: { role: "user", content: "go" } },
    {
      type: "assistant",
      message: { role: "assistant", content: [{ type: "text", text: "progress note" }] },
    },
    {
      type: "assistant",
      message: {
        role: "assistant",
        content: [{ type: "text", text: "another note" }, { type: "tool_use", id: "t" }],
      },
    },
    {
      type: "user",
      message: { role: "user", content: [{ type: "tool_result", content: "x" }] },
    },
    {
      type: "assistant",
      message: { role: "assistant", content: [{ type: "text", text: "part one" }] },
    },
    {
      type: "assistant",
      message: { role: "assistant", content: [{ type: "text", text: "part two" }] },
    },
  ]);
  assert.equal(finalAnswerIn(raw), "part one\n\npart two");
});

test("ignores subagent turns and tool results", () => {
  const raw = transcriptLines([
    { type: "user", message: { role: "user", content: "go" } },
    {
      type: "assistant",
      isSidechain: true,
      message: { role: "assistant", content: [{ type: "text", text: "subagent" }] },
    },
    {
      type: "user",
      message: { role: "user", content: [{ type: "tool_result", content: "x" }] },
    },
    {
      type: "assistant",
      message: { role: "assistant", content: [{ type: "text", text: "mine" }] },
    },
  ]);
  assert.equal(finalAnswerIn(raw), "mine");
});

test("survives a truncated transcript line", () => {
  assert.equal(finalAnswerIn('{"type":"user"'), "");
});

test("the brief names the output path and carries the passage", () => {
  const source = "- The report was written by the team.\n";
  const text = brief({
    source,
    findings: allProblems(source, editorial),
    outPath: "/tmp/out.md",
    label: "draft.md",
  });
  assert.ok(text.includes("/tmp/out.md"));
  assert.ok(text.includes("The report was written by the team."));
});

test("counts words the way the hook threshold does", () => {
  assert.equal(wordsIn("one two  three\nfour"), 4);
});
