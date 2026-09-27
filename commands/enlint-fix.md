---
name: enlint-fix
description: Lint a file the user names against the house style and rewrite what it flags through the cheap prose-rewriter subagent.
---

Run the fix workflow from the `english-style` skill on `$ARGUMENTS`.

If `$ARGUMENTS` names a file, work on that file. If it is empty, ask the user
which file they mean. Documents you write are already rewritten in the
background, so this command is for files the user points at.

`enlint` is not on the PATH. Run it as `node "${CLAUDE_PLUGIN_ROOT}/bin/enlint.mjs"`.
The workflow has three steps:

    node "${CLAUDE_PLUGIN_ROOT}/bin/enlint.mjs" fix <file>

prints a summary, a `brief:` path and a `write:` path. Do not read the brief.
Spawn `Agent(subagent_type: "enlint:prose-rewriter", prompt: "Read <brief path>
and follow it.")`, then score the result:

    node "${CLAUDE_PLUGIN_ROOT}/bin/enlint.mjs" verify <file> <write path>

Keep the rewrite when it clears problems without losing half the words, and
leave the original alone when it came back worse. Run the rewriter once per
passage.

Show the user a diff before you overwrite a file they wrote, and report the
verdict line in one sentence.
