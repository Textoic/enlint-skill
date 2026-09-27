# enlint

Makes a coding agent write English like a person. It wraps
[`english-lint`](../english-lint) — the rules — and [`nlp`](../nlp) — the parser
— into something an agent applies to its own output, both before it writes and
after.

Three pieces do that. A style card loads at session start, so the agent knows
the rules before it writes a word. A hook reads the final answer of every turn
and lints it, which costs no tokens at all because linting is a subprocess
rather than a model call. When something needs rewriting, the work goes to a
subagent on a cheap model that carries the full style guide in its own
instructions, so the passage, the guide and the findings never enter the
context of the agent you are actually talking to.

That last part is the whole design. A rewrite needs perhaps three thousand
tokens of guide and passage in somebody's context. Putting them in Haiku's
costs a fraction of putting them in Opus's, and the caller only ever handles a
summary line, two file paths and a verdict — under a hundred tokens for a full
detect-and-rewrite cycle.

## What it catches

Fifteen rules across three scopes. The word rules are a list of 451 flagged
words and expressions plus the explained antonyms ("not harmful" for
"harmless"), explained intensifiers ("very bad" for "awful"), similes, and the
em dash. The sentence rules are passives, noun stacks, nested clauses, negated
contrasts ("not just X but Y"), absolute phrases and sentences packed too
densely with nouns. The shape rules are bulleted lists and bold phrases at the
head of a paragraph, which do not exist in `english-lint` because they are
line-level markdown judgements rather than sentence-level ones, and which
matter more than any single word for this purpose: a bulleted answer with a
bold lead-in on every paragraph is the fastest way to recognise machine writing,
and it is the default shape of an agent's output.

Code is safe. Fenced blocks, inline code, URLs and link targets are masked
before anything is parsed, so no rule can fire inside them.

## Before you install

Node 22 or newer. The two sibling repositories must sit next to this one and be
built, because this package links them as `file:` dependencies and runs their
compiled output.

    cd ../nlp          && npm install && npm run build
    cd ../english-lint && npm install && npm run build
    cd ../enlint-skill && npm install && npm run build

Then confirm the pieces are where they should be:

    node scripts/install.mjs doctor

It prints a line per check and tells you what to rebuild if anything is
missing.

## Installing into Claude Code

The repository is both a plugin and a one-plugin marketplace, so Claude Code
installs it in two commands:

    /plugin marketplace add C:/Users/neytopia/Documents/projects/enlint-skill
    /plugin install enlint@enlint-local

Restart Claude Code afterwards. Hooks are read once at session start and never
reloaded, so a running session will not see them.

Running `node scripts/install.mjs claude` prints those same two commands with
the path already filled in.

If you would rather not use the plugin system, wire the same three pieces by
hand. Copy `skills/english-style` into `~/.claude/skills/`, copy
`agents/prose-rewriter.md` into `~/.claude/agents/`, and merge the contents of
`hooks/hooks.json` into the `hooks` object of `~/.claude/settings.json`,
replacing `${CLAUDE_PLUGIN_ROOT}` with the absolute path to this checkout.

## Installing into Codex

Codex gets the proactive half and the command-line half. Point the installer at
whichever project you want it in and it writes the style card, with absolute
paths already substituted, into that project's `AGENTS.md` between markers so
re-running replaces the block rather than duplicating it:

    node scripts/install.mjs codex C:/path/to/your/project

The turn-end hook is Claude-only. Codex exposes a single `notify` program for
turn-ended events and yours is already taken by computer-use, so there is no
free slot to lint the finished answer from. In Codex you run `enlint check`
yourself, which the block written into `AGENTS.md` tells the agent to do.

## Testing it yourself

Start with the linter, which needs neither harness. A deliberately bad fixture
ships with the repository:

    node bin/enlint.mjs check test/fixtures/bad-prose.md

You should see fifteen findings on 136 words, each with its line, column,
scope, rule and the flagged span, and a one-line summary underneath. It takes
about a third of a second, most of which is loading an eleven-megabyte
dictionary. Pipe your own writing through it with `node bin/enlint.mjs check -`.

Now the rewrite loop, by hand, the way the skill drives it:

    node bin/enlint.mjs fix test/fixtures/bad-prose.md

It applies the fixes that need no judgement — one em dash, in this case — and
prints a summary with two paths, one to a brief and one to where a rewrite
belongs. Read the brief to see what the subagent is told; then never read one
again, because reading it in your main context is the cost the whole design
exists to avoid. Adding `--write` saves those free fixes back into the file,
which is the only part of the pipeline that changes anything without asking a
model. Write a rewrite by hand to the second path, or ask an agent to, and
score it:

    node bin/enlint.mjs verify test/fixtures/bad-prose.md <the rewrite>

which reports how many problems cleared, how many survived, how many the
rewrite introduced, and the word count on both sides. It exits 1 while anything
is still flagged, and warns when the rewrite lost half the passage — a model
that summarises instead of rewriting produces text that lints perfectly and is
worse than what you gave it, so the word count is the check that matters most.

To watch the turn-end hook work without waiting for a turn, feed it a payload
by hand. Any transcript will do; this takes the newest one from this project:

    T=$(ls -t ~/.claude/projects/C--Users-neytopia-Documents-projects-enlint-skill/*.jsonl | head -1)
    W=$(echo "$T" | sed 's|^/c/|C:/|')
    printf '{"transcript_path":"%s","stop_hook_active":false}' "$W" | ENLINT_DEBUG=1 node hooks/stop-lint.mjs

It prints the JSON it would hand Claude Code, or nothing when the answer was
clean or too short. The path substitution matters on Windows: a Git Bash path
like `/c/Users/...` resolves to `C:\c\Users\...` and produces a misleading
file-not-found.

Once the plugin is installed, the end-to-end test is to ask Claude for several
paragraphs of prose on anything and watch for an `enlint:` note after it
answers. Then ask it to fix that answer; it should run `enlint fix`, spawn
`prose-rewriter`, and report a verdict line without ever showing you the brief.

## Turning it down

The hook says nothing below 60 words or 3 findings, so short factual replies
never draw a note. Both thresholds are environment variables, `ENLINT_MIN_WORDS`
and `ENLINT_MIN_ISSUES`; raise them if it still speaks up more than you want.
`ENLINT_PROACTIVE=0` drops the session-start style card and keeps the linting.
`ENLINT_DISABLE=1` turns off both hooks and leaves the command line working.
`ENLINT_DEBUG=1` makes the hook print what it swallowed, which is the only way
to tell a broken hook from a clean answer, since it exits 0 on every path by
design.

Individual rules come off with `--off`, which takes a comma-separated list of
rule ids; `node bin/enlint.mjs rules` names all fifteen. Switch one off for
prose where it genuinely does not apply, not for prose you could not fix.

## What it will not do

The note arrives after the answer is already on your screen. That is the price
of never blocking: the alternative is refusing to let a turn finish until its
prose passes, which loops forever on a passage no rewrite will clear and costs
you a turn every time a correct short answer trips one rule. The fix is one
command away rather than automatic.

Nothing lints prose inside source files. The hook reads the final answer of a
turn and the command line reads files you name; an agent writing documentation
into a `.md` file is not checked unless you check it.

The rules encode one person's house style, not a general theory of good
English. `no-special-punctuation` objects to the em dash because it is eight
times more common in a model's prose than in a person's, which is a fact about
detection rather than about quality. If you disagree with a rule, switch it off
rather than writing around it.

## Layout

`src/` holds the library and `bin/enlint.mjs` the command line. `skills/`,
`agents/`, `commands/` and `hooks/` are the Claude Code plugin, discovered by
convention. `style/` holds the four guides: the compact card that loads at
session start, and the three full ones the rewriter carries. `codex/` holds the
block the installer writes into a Codex project.

Six modules under `src/` were copied from `../enlint-lab` rather than imported,
to keep this installable without dragging a research repository behind it.
`docs/architecture.md` records that trade and the rest of the decisions, newest
first, and `CLAUDE.md` is the working agreement for changing any of it.
