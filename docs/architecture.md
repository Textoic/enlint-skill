# Architecture notes

Newest first. One finding each.

## 2026-09-14 — Documentation about a linter trips the linter

Linting this repository's own prose reports 31 problems in `README.md` and 16
in this file, and most of the word-level ones are the rules matching the text
that documents them. `no-explained-antonyms` fires on "not harmful", and
`no-explained-intensifiers` fires on `("very bad"`, because the README quotes
both as examples of what those rules catch. `no-negated-contrasts` fires on the
style card's own "not A, but B".

Those are not defects in the prose and they are not defects in the rules. They
are the same effect `enlint-lab` records for transcripts: a document that
discusses a vocabulary contains that vocabulary. Expect it in anything written
about this project, and read a rate measured over these files as a fact about
self-reference rather than about writing quality.

The em dashes the same run found are real, and the README still has them.

## 2026-09-14 — The style card must obey the style card

`style/compact.md` opened three paragraphs with a bold lead-in while telling the
model not to open paragraphs with bold lead-ins, and used an em dash while
telling it not to. The card is injected into every session as instructions, so
its shape teaches by example, and an instruction that demonstrates its own
violation is worse than no instruction. It is now written as the running prose
it asks for.

Check it with `node bin/enlint.mjs check style/compact.md` after any edit. The
negated contrast it still reports is the rule quoting itself, per the note
above.

## 2026-09-14 — Windows paths must go through pathToFileURL

`hooks/stop-lint.mjs` loaded the compiled library with
``import(`file://${root}/dist/${name}`)``. On Windows `root` is
`C:\Users\...`, so that builds `file://C:\Users\...`, which is not a valid URL.
The import threw, the catch-all swallowed it, and the hook exited 0 with no
output — indistinguishable from "the answer was clean". Use `pathToFileURL`.

The same shape of bug is invisible by construction: a hook that must never
break a session catches everything, and a hook that catches everything cannot
tell you it is broken. `ENLINT_DEBUG=1` prints the stack to stderr and exists
only for that reason. Test the hook by feeding it a payload with a real
Windows path; a Git Bash path like `/c/Users/...` resolves to `C:\c\Users\...`
and produces a misleading ENOENT.

## 2026-09-14 — The main agent never reads the brief

The point of the split is that detection is free and rewriting is not. Linting
is a subprocess: it costs no tokens, so the Stop hook can run on every turn.
Rewriting needs the style guide, the flagged spans and the whole passage in
some model's context, and the cheapest place to put them is a subagent running
a small model.

So `enlint fix` writes the brief to a temp file and prints only its path. The
caller passes that path to `prose-rewriter` and never opens it. The full style
guide lives in `agents/prose-rewriter.md`, which loads into the subagent's
context and never into the caller's. What the caller spends on a rewrite is
the summary line, two paths, and the verdict — under a hundred tokens.

If a change makes the main agent read the brief, the guide, or the passage, it
has given up the only reason this is shaped the way it is.

## 2026-09-14 — Advisory, not blocking, on Stop

The Stop hook reports and never blocks. Blocking would mean the agent cannot
finish its turn while its answer trips a rule, which is the only way to make
the model fix prose before the user sees it — and also a way to loop forever on
a passage no rewrite will clear. A flagged answer is usually still a correct
answer, and a short factual reply that trips one rule should not cost a turn.

The consequence, which the design accepts: advice arrives after the answer is
already on screen. The note names `/enlint-fix` so the fix is one command away
rather than something the model must re-derive.

Thresholds keep it quiet: nothing is said below 60 words or 3 findings
(`ENLINT_MIN_WORDS`, `ENLINT_MIN_ISSUES`). Without them every two-line answer
would draw a note and the whole thing would read as nagging.

## 2026-09-14 — Six modules were copied from enlint-lab, not imported

`markdown.ts`, `document.ts`, `structure.ts`, `config.ts`, `verify.ts` and the
deterministic half of `punctuate.ts` (here `mechanical.ts`) came from
`../enlint-lab` almost verbatim.

Importing the lab instead would have dragged in express, hyparquet and a corpus
store to get four hundred lines of text handling, and would have made a skill
that anyone can install depend on a research repo that is gitignored in the
parts that matter. Copying costs divergence: a bug fixed in one is not fixed in
the other. That trade is recorded here so the next person checks both.

`english-lint` and `nlp` are real dependencies, linked with `file:`. They are
built artefacts (`dist/`), so both must be built before this package runs.

## 2026-09-14 — Shape rules are not in english-lint

`no-lists` and `no-bold-lead-ins` are line-level markdown judgements, not
sentence-level ones, so they never belonged in a rule set that takes parsed
sentences. They live in `structure.ts` and are merged into the findings list by
`lint.ts`. They matter more than any single word rule for this use case: a
bulleted answer with a bold phrase at the head of each paragraph is the fastest
way to recognise machine writing, and it is the default shape of an agent's
output.
