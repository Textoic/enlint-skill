import assert from "node:assert/strict";
import { test } from "node:test";
import { rewrapLike, wrapWidth } from "../src/wrap.js";

const SOURCE = `First paragraph stays exactly as the author wrapped it,
even though a rewrite would join it.

Second paragraph gets rewritten by the model and comes back
on one line.
`;

test("measures the width a hard-wrapped document uses", () => {
  assert.equal(wrapWidth(SOURCE), 59);
  assert.equal(wrapWidth("One long paragraph on a single line.\n\nAnother one.\n"), 0);
});

test("keeps untouched paragraphs byte for byte and wraps the changed ones", () => {
  const rewrite =
    "First paragraph stays exactly as the author wrapped it, even though a rewrite would join it.\n\nThe model rewrote the second paragraph, and it now arrives as one long line of text.";
  assert.equal(
    rewrapLike(SOURCE, rewrite),
    "First paragraph stays exactly as the author wrapped it,\neven though a rewrite would join it.\n\nThe model rewrote the second paragraph, and it now arrives\nas one long line of text.",
  );
});
