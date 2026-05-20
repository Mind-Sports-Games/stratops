# stratops

TypeScript library implementing strategy game rules and operations for playstrategy.org. Supports chess variants, draughts, Go, Shogi, Backgammon, Othello, Abalone, and more.

## Key facts

- Build: `pnpm prepare` (outputs ESM + CJS to `dist/`)
- Test: `pnpm test` (Jest + ts-jest)
- Lint/format: `pnpm lint`, `pnpm format` (dprint)
- Entry point: `src/index.ts`
- Variants live in `src/variants/`; shared primitives (`SquareSet`, `Board`, `attacks`) are in `src/`

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:

- ALWAYS read graphify-out/GRAPH_REPORT.md before reading any source files, running grep/glob searches, or answering codebase questions. The graph is your primary map of the codebase.
- IF graphify-out/wiki/index.md EXISTS, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
