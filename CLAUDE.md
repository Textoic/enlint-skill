# Working on enlint-skill

This packages `english-lint` as something an agent uses on its own writing: a
style card in the system prompt, a linter that reads the final answer of
every turn for free, and a cheap background model that does the rewriting.

`english-lint` holds the rules and `nlp` parses the text. Neither knows this
project exists, and neither should. What belongs here is everything about
running them over an agent's own output: masking markdown, reading transcripts,
scoring a rewrite, and keeping the token cost of all of it near zero.

The modules under `src/` that mask markdown, chunk a document, score a rewrite
and detect list shape were taken from `../enlint-lab` rather than invented. When
a bug turns up in one of them, check whether the lab has the same bug.

## The working agreement

### 1. No comments in code

Not one. Not a header, not a `//` at the end of a line, not a JSDoc block. The
only comments allowed are machine-readable directives: `eslint-disable`,
`@ts-expect-error`, `prettier-ignore`.

A comment is a claim about the code that no test checks and no compiler
verifies, so it rots, and a wrong comment costs more than no comment. Write
code that does not need one: name the variable after what it holds, name the
function after what it does, and lift a condition you were about to explain
into a predicate whose name is the explanation.

Prose that cannot live in a name goes in `docs/architecture.md`, newest entry
first, dated, one finding each.

### 2. Keep functions simple

Cyclomatic complexity at most 10, nesting depth at most 3, at most 20
statements, at most 60 lines, at most 4 parameters. When a function outgrows
that, ask what it is actually deciding and give each decision a name. An
if-chain that maps a value to a result becomes a lookup object; a function that
gathers, then decides, then formats, becomes three functions.

### 3. The hook must never break a session

`hooks/stop-lint.mjs` runs on every turn. It exits 0 on every path, including
every failure path, and it writes nothing to stdout unless it has something to
say. A hook that throws where the harness can see it costs the user their turn.
Set `ENLINT_DEBUG=1` to see what it swallowed.

### 4. Never spend main-context tokens on prose the subagent should read

The brief, the style guide and the flagged passages belong in the rewriter's
context, not the caller's. If a change makes the main agent read any of them,
it is the wrong change.

### 5. Write the summary in the house style

Run the linter on your own summary before you hand it over: `npm run enlint
check -`. Say what you changed, what you verified and how, and what you left
undone. If tests fail, print the failure.
