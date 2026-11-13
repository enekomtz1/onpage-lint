# Decisions

A running log of product and technical decisions: what was chosen, what was
rejected and why.

## 001 — Build an on-page SEO linter for static sites

- **Decision:** `onpage-lint`, a CLI that audits the HTML a static site
  generator produces.
- **Rejected:** a browser extension (harder to test automatically, review
  process to publish); a hosted web app that crawls live URLs (needs a server,
  and fetching third-party sites raises rate-limit and data questions).
- **Why:** I build and launch static sites and repeat the same on-page checks
  by hand each time. A local CLI is easy to test, runs in CI and needs no
  paid services.

## 002 — Lint local files, never the network

- **Decision:** the tool only reads files under the directory it is given.
- **Rejected:** crawling a deployed URL.
- **Why:** deterministic results, fast tests, no API keys, and nothing but the
  user's own build output is ever read.

## 003 — TypeScript, Node.js 20+, ES modules

- **Decision:** TypeScript compiled with `tsc`, ESM only, Node 20 or newer.
- **Rejected:** Rust or Go (faster, but the audience already has Node
  installed and can add the tool as a dev dependency); a bundler (not needed
  for a CLI of this size).
- **Why:** mature, well-documented stack that matches the projects the tool is
  used on.

## 004 — cheerio for HTML parsing

- **Decision:** `cheerio` (parse5 underneath) with source locations enabled.
- **Rejected:** `jsdom` (heavier, executes more than needed); regular
  expressions (unreliable on real HTML).
- **Why:** spec-compliant parsing, a familiar selector API for writing rules,
  and line numbers for findings.

## 005 — Vitest, ESLint and Prettier

- **Decision:** Vitest for tests, ESLint (typescript-eslint) for linting,
  Prettier for formatting, all run in GitHub Actions.
- **Rejected:** Jest (extra ESM/TypeScript configuration); Biome (younger
  ecosystem).
- **Why:** zero-config TypeScript and ESM support and wide adoption.

## 006 — MIT license

- **Decision:** MIT.
- **Why:** simplest permissive license; there is no technical reason to need
  Apache 2.0's patent terms here.

## 007 — Each rule is a small object behind one shared contract

- **Decision:** every rule implements the `Rule` interface in `src/types.ts`
  and receives a parsed `Page` plus a read-only `SiteContext`.
- **Rejected:** rules that read files themselves; a visitor/AST-walker API.
- **Why:** rules stay pure and unit-testable from an HTML string, cross-page
  checks (duplicate titles, broken links) are still possible through the
  context, and new rules can be added without touching the engine.

## 008 — Repository language

- **Decision:** code, README, issues and commit messages in English;
  `docs/PROPUESTA.md` in Spanish.
- **Why:** English reaches the intended audience; the proposal is a personal
  planning document.
