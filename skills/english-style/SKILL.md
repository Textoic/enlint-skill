---
name: english-style
description: Use when writing or revising prose a person will read - chat answers, summaries, reports, documentation, design notes, commit messages - or when asked to "check the style", "fix my writing", "make this sound human", "rewrite this properly", or "run enlint". Lints text against the english-lint rule set and hands the rewrite to a cheap subagent.
---

# Writing and fixing English prose

The house style is summarised in the card loaded at session start. Run
`node "${CLAUDE_PLUGIN_ROOT}/bin/enlint.mjs" guide compact` if you need it
again, or `guide all` for the full three-part guide. Do not paste either into
your reply.

Everything below runs a linter locally. Detection costs no tokens, so prefer
running it over judging prose by eye.

## Checking

    node "${CLAUDE_PLUGIN_ROOT}/bin/enlint.mjs" check <file>

Each line is `line:col`, scope, rule, the flagged span, and any replacement the
rule computed. `--summary` collapses it to one line, `--json` gives the raw
findings, `--strict` exits 1 when anything is flagged. To check your own last
answer instead of a file, pass `--transcript <path>` with the transcript path
the Stop hook reported.

Three scopes come back. `shape` problems are lists and bold paragraph lead-ins,
the two things that mark a piece as machine-written faster than any word does.
`sentences` problems are passives, noun stacks, nested clauses and negated
contrasts. `words` problems are the vocabulary list.

## Fixing

Never rewrite a flagged passage in your own context. The rewrite is three
passes over the whole passage and it burns tokens you should not be spending.
Hand it to the `prose-rewriter` subagent, which runs on a cheap model and
carries the full style guide in its own instructions.

    node "${CLAUDE_PLUGIN_ROOT}/bin/enlint.mjs" fix <file>

That applies the fixes that need no judgement, then prints a one-line summary
and two paths: a brief, and the file the rewrite belongs in. **Do not read the
brief.** It exists so the subagent reads it instead of you.

Spawn the rewriter with those two paths:

    Agent(subagent_type: "prose-rewriter",
          description: "Rewrite <name>",
          prompt: "Read <brief path> and follow it.")

Then score what came back:

    node "${CLAUDE_PLUGIN_ROOT}/bin/enlint.mjs" verify <original> <rewritten>

It reports how many problems cleared, how many survived, how many the rewrite
introduced, and the word count either side. Exit 1 means something is still
flagged.

Judge the result on that number, not on how the prose reads to you. Keep the
rewrite when it clears problems without shrinking the passage by half; a large
drop in word count means the model summarised instead of rewriting, and that
result is worse than the text you started with even though it lints clean. If
it came back worse, say so and leave the original alone rather than running the
subagent again on the same passage.

Apply the rewrite by copying the rewritten file over the original, or by
showing the user the diff first when the file is theirs rather than yours.

## When the Stop hook speaks up

A note reading `enlint: N style issues ...` means the answer you just finished
tripped the linter. It never blocks you and it is not an error. Either fix it
in your next turn, or leave it; a short factual answer that trips one rule is
not worth a rewrite. Run the fix workflow when the answer was long prose the
user is likely to keep.

## What not to do

Do not apply the style to code, identifiers, file paths, log output, or
anything you are quoting. The linter already masks fenced code, inline code and
URLs, so a finding never points at them.

Do not silence a rule to make a passage pass. `--off <rule>` exists for prose
where a rule genuinely does not apply, not for prose you could not fix.
