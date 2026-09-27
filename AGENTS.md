# Working on enlint-skill

The working agreement for this repository is in [CLAUDE.md](CLAUDE.md) and
applies to every agent, not only Claude. Read it before you change anything.

The short version: no comments in code, small functions, the Stop hook exits 0
on every path, and no change may put the style guide or a rewrite brief into
the calling agent's context.

Design decisions and the reasons behind them are in
[docs/architecture.md](docs/architecture.md), newest first. Read it before you
start; it is the fastest way to avoid repeating an experiment that already
failed.
