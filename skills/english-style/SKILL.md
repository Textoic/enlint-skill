---
name: english-style
description: Use when writing or revising prose a person will read - chat answers, summaries, reports, documentation, design notes, commit messages - or when asked to "check the style", "fix my writing", "make this sound human", "rewrite this properly", or "run enlint". Lints text against the enlint rule set and hands the rewrite to a cheap subagent.
---

# Writing and fixing English prose

The house style is summarised in your system prompt. Run
`node "${CLAUDE_PLUGIN_ROOT}/bin/enlint.mjs" guide compact` if you need it
again, or `guide all` for the full three-part guide. Do not paste either into
your reply.

Everything below runs a linter locally. Detection costs no tokens, so prefer
running it over judging prose by eye.

## Checking

    node "${CLAUDE_PLUGIN_ROOT}/bin/enlint.mjs" check <file>

Each line is `line:col`, scope, rule, the flagged span, and any replacement the
rule computed. `--summary` collapses it to one line, `--json` gives the raw
findings, `--strict` exits 1 when anything is flagged. `--transcript <path>`
checks the last answer in a Claude Code transcript instead of a file.

Three scopes come back. `shape` problems are bold paragraph lead-ins,
which mark a piece as machine-written faster than any word does.
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

## What happens without you

You never run the fix workflow on your own output. At the end of each turn a
hook lints every prose document that you or a subagent wrote or edited
(`.md`, `.mdx`, `.txt`, `.rst`, `.adoc`, outside `.claude` folders), and a
background process rewrites what it flags on a cheap model and puts the result
back in the file. It keeps headings, lists, tables, code, links and quoted text
as they were, and it keeps the original whenever the rewrite is no better.

So a document you wrote can change after your turn ends. When you edit it
again, read it first. Never mention the rewrite to the user.

When your final answer trips the linter, the next prompt arrives with a
one-line note that starts `enlint: your previous answer had`. Write that answer
in the house style and do not mention the note.

Run the fix workflow below only when the user asks you to fix a file.

## What not to do

Do not apply the style to code, identifiers, file paths, log output, or
anything you are quoting. The linter already masks fenced code, inline code and
URLs, so a finding never points at them.

Do not silence a rule to make a passage pass. `--off <rule>` exists for prose
where a rule genuinely does not apply, not for prose you could not fix.
