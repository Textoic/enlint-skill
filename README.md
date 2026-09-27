# enlint

Makes a coding agent write English like a person, in Claude Code and in Codex.
It wraps [`enlint`](../enlint), which holds the rules, and
[`artisan`](../artisan), which parses the text, into something an agent applies
to its own output, both before it writes and after.

Three pieces do that. The style card sits in Claude's system prompt as an
output style, so the agent knows the rules before it writes a word and keeps
them for the whole session. A hook reads the final answer of every turn,
and every prose document the agent wrote in it, and lints them, which costs no
tokens at all because linting is a subprocess rather than a model call. When
a document needs rewriting, a background process hands it to a
subagent on a cheap model that carries the full style guide in its own
instructions, so the passage, the guide and the findings never enter the
context of the agent you are actually talking to.

That last part is the whole design. A rewrite needs perhaps three thousand
tokens of guide and passage in somebody's context. Putting them in Haiku's
costs a fraction of putting them in Opus's, and the caller only ever handles a
summary line, two file paths and a verdict — under a hundred tokens for a full
detect-and-rewrite cycle.

## What it catches

Fourteen rules across three scopes. The word rules are a list of 451 flagged
words and expressions plus the explained antonyms ("not harmful" for
"harmless"), explained intensifiers ("very bad" for "awful"), similes, and the
em dash. The sentence rules are passives, noun stacks, nested clauses, negated
contrasts ("not just X but Y"), absolute phrases and sentences packed too
densely with nouns. The shape rule flags a bold phrase at the head of a
paragraph. It does not exist in `enlint` because it is a line-level
markdown judgement rather than a sentence-level one, and a bold lead-in on every
paragraph is one of the fastest ways to recognise machine writing. Lists are
fine, and nothing flags them.

Code is safe. Fenced blocks, inline code, URLs and link targets are masked
before anything is parsed, so no rule can fire inside them.

## Before you install

Node 22 or newer. The two sibling repositories must sit next to this one and be
built, because this package links them as `file:` dependencies and runs their
compiled output.

    cd ../artisan      && npm install && npm run build
    cd ../enlint       && npm install && npm run build
    cd ../enlint-skill && npm install && npm run build

`npm run build` compiles `src/` and then bundles it, with both sibling
libraries and the dictionary, into `bundle/`. The plugin runs from that bundle
and nothing else, so a copy of this folder works on its own. Claude Code keeps
such a copy in `~/.claude/plugins/cache`, and the `file:` links in
`node_modules` point at folders that do not exist beside it.

Then confirm the pieces are where they should be:

    node scripts/install.mjs doctor

It prints a line per check, including whether the installed copy can lint
anything, and tells you what to rebuild if a check fails.

## Installing into Claude Code

The repository is both a plugin and a one-plugin marketplace, so Claude Code
installs it in two commands:

    /plugin marketplace add C:/Users/neytopia/Documents/projects/enlint-skill
    /plugin install enlint@enlint-local

Restart Claude Code afterwards. Hooks are read once at session start and never
reloaded, so a running session will not see them.

Hooks run from this folder, so a rebuild reaches them at the next session
start. To refresh the cached copy as well, bump `version` in
`.claude-plugin/plugin.json` and run `/plugin marketplace update enlint-local`
followed by `/plugin update enlint@enlint-local`.

Running `node scripts/install.mjs claude` prints those same two commands with
the path already filled in.

If you would rather not use the plugin system, wire the same three pieces by
hand. Copy `skills/english-style` into `~/.claude/skills/`, copy
`agents/prose-rewriter.md` into `~/.claude/agents/`, and merge the contents of
`hooks/hooks.json` into the `hooks` object of `~/.claude/settings.json`,
replacing `${CLAUDE_PLUGIN_ROOT}` with the absolute path to this checkout.

## Installing into Codex

Codex gets everything Claude Code gets. Its hooks copy Claude's format field for
field, so the same `hooks/hooks.json` serves both, and the repository is also a
Codex plugin (`.codex-plugin/plugin.json`) and a Codex marketplace
(`.agents/plugins/marketplace.json`). The style card goes into
`developer_instructions` in `~/.codex/config.toml`, which Codex sends as a
developer message in every session:

    node scripts/install.mjs codex

It writes the card between `# enlint:begin` and `# enlint:end` markers, so
running it again replaces the block, and on the first run it saves your file as
`config.toml.enlint-backup`. It refuses to run when you already set
`developer_instructions` yourself. Then it installs the plugin with the Codex
CLI. You need no `codex` command on your PATH: the ChatGPT app ships the CLI at
`%LOCALAPPDATA%\OpenAI\Codex\bin\<version>\codex.exe`, and the installer finds
it there. Set `ENLINT_CODEX` to a path to override it.

Codex runs a plugin's hooks only after you approve them once. In the ChatGPT
app, a **Review hooks** button appears in the Codex composer while any hook
waits for approval; the plugin's page under Plugins and the Hooks section of
Settings offer the same review. In the terminal CLI, run `/hooks`.

Codex on Windows often writes files through PowerShell rather than its patch
tool, and no hook sees what a shell command wrote. So the Stop hook also looks
for prose files created during the turn, under the folder Codex runs in. It
takes only files born during the turn, because for a file that already existed
it cannot tell the agent's text from yours.

Each harness rewrites with its own cheap model and nothing else. A Codex turn
hands its documents to `codex exec` on `gpt-6-luna` at low reasoning effort,
run ephemeral, read-only and with `--ignore-user-config`, so the child loads no
plugins, no hooks and no style card. A Claude turn hands them to `claude -p` on
Haiku. The Stop hook tells the two apart by the `turn_id` field that only Codex
sends.

Codex installs a copy of the plugin, so after a rebuild bump `version` in
`.codex-plugin/plugin.json` and run `codex plugin add enlint@enlint-local`
again.

## Testing it yourself

Start with the linter, which needs neither harness. A deliberately bad fixture
ships with the repository:

    node bin/enlint.mjs check test/fixtures/bad-prose.md

You should see twelve findings on 136 words, each with its line, column,
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
    printf '{"session_id":"try","transcript_path":"%s","stop_hook_active":false}' "$W" | ENLINT_DEBUG=1 node hooks/stop-lint.mjs

It prints the JSON it would hand Claude Code, or nothing when the answer was
clean or too short. The path substitution matters on Windows: a Git Bash path
like `/c/Users/...` resolves to `C:\c\Users\...` and produces a misleading
file-not-found. To include documents, first send `hooks/record-write.mjs` one
`{"session_id":"try","tool_name":"Write","tool_input":{"file_path":"..."}}`
payload per file, with the same session id.

Once the plugin is installed, the end-to-end test is to ask Claude to write a
markdown document of a few paragraphs in a corporate voice. Nothing appears in
the conversation. About ten seconds after the turn ends the file changes on
disk, and `node bin/enlint.mjs log` shows the rewrite, what it cleared and what
it cost.

## Turning it down

The hook says nothing below 60 words or 3 findings, so short factual replies
never draw a note. `ENLINT_MODE=notify` shows you what was flagged and rewrites
nothing. `ENLINT_DOCUMENTS=0` stops it recording the documents Claude writes,
`ENLINT_FEEDBACK=0` drops the note about a flagged answer, and
`ENLINT_CLAUDE_MODEL` and `ENLINT_CODEX_MODEL` pick the background model for
each harness, `haiku` and `gpt-6-luna` by default. `ENLINT_REWRITER=claude` or
`codex` forces one backend for both. Both thresholds are environment variables, `ENLINT_MIN_WORDS`
and `ENLINT_MIN_ISSUES`; raise them if it still speaks up more than you want.
The style card is a plugin output style that switches itself on, and it is
built from `style/compact.md` by `npm run build`. Choosing another style in
`/config` replaces it, and disabling the plugin removes it.
`ENLINT_DISABLE=1` turns off every hook and leaves the command line working.
`ENLINT_DEBUG=1` makes the hook print what it swallowed, which is the only way
to tell a broken hook from a clean answer, since it exits 0 on every path by
design.

Individual rules come off with `--off`, which takes a comma-separated list of
rule ids; `node bin/enlint.mjs rules` names all fourteen. Switch one off for
prose where it genuinely does not apply, not for prose you could not fix.

## What it will not do

A chat answer is never rewritten. Claude Code shows the answer before any hook
can read it, so the only way to fix one is to send it twice, and that costs the
tokens and the screen space this plugin exists to save. The hook leaves a
one-line note that reaches Claude with your next message instead, so the next
answer follows the style.

A background rewrite keeps headings, lists, tables, code, links and quoted text
exactly as they were, and wraps changed paragraphs to the width the file
already uses. It keeps the original when the rewrite changed any of those, when
it cleared no more than it introduced, when it lost half the words, or when the
file changed while it ran. Every attempt lands in `node bin/enlint.mjs log`.

The hook lints the answer you read at the end of a turn, which is the text
after Claude's last tool call, and skips the progress notes before it. It lints
documents that subagents write as well as Claude's own. It never sees a file
written through a shell command, such as a heredoc or a script, because only
the `Write`, `Edit` and `MultiEdit` tools pass through it. It also skips prose
inside source files, and documents under a `.claude` folder, which holds memory
and settings rather than anything a person reads.

The rules encode one person's house style, not a general theory of good
English. `no-special-punctuation` objects to the em dash because it is eight
times more common in a model's prose than in a person's, which is a fact about
detection rather than about quality. If you disagree with a rule, switch it off
rather than writing around it.

## Layout

`src/` holds the library, `bundle/` the self-contained build the plugin runs,
and `bin/enlint.mjs` the command line. `skills/`,
`agents/`, `commands/`, `hooks/` and `output-styles/` are the Claude Code
plugin, discovered by convention. `style/` holds the four guides: the compact
card that becomes the output style, and the three full ones the rewriter
carries. `.codex-plugin/` and `.agents/plugins/` make the same folder a Codex
plugin and marketplace.

Six modules under `src/` were copied from `../enlint-lab` rather than imported,
to keep this installable without dragging a research repository behind it.
`docs/architecture.md` records that trade and the rest of the decisions, newest
first, and `CLAUDE.md` is the working agreement for changing any of it.
