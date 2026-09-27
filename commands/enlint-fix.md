---
name: enlint-fix
description: Lint a file (or your own last answer) against the house style and rewrite what it flags through the cheap prose-rewriter subagent.
---

Run the fix workflow from the `english-style` skill on `$ARGUMENTS`.

If `$ARGUMENTS` names a file, work on that file. If it is empty, work on your
own last answer: take the transcript path from the most recent `enlint:` note,
run `check --transcript <path> --json`, and write the answer to a temporary file
to rewrite it.

The workflow is: `enlint fix` to get a brief, the `prose-rewriter` subagent to
do the rewriting, `enlint verify` to score it. Do not read the brief yourself.
Report the verdict line and what you changed, and show the user a diff before
overwriting a file they wrote.
