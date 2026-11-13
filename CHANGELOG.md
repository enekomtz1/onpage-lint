# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-11-13

First release.

### Added

- `onpage-lint <dir>` command that lints every `.html` and `.htm` file under a
  directory, reading local files only (no network access).
- Engine that walks the site (skipping `node_modules` and dot-directories, not
  following symbolic links), parses each page with cheerio and reports findings
  with source line numbers, sorted by page, line and rule.
- Ten rules, documented in [docs/rules.md](docs/rules.md):
  - Head: `title`, `meta-description`, `canonical`, `html-lang`, `viewport`,
    `robots-noindex`.
  - Content: `h1`, `img-alt`, `internal-links`, `json-ld`.
- Cross-page checks for duplicate titles and meta descriptions, and internal
  link resolution against the files in the site.
- Text reporter (findings grouped by page, aligned columns, summary line) and
  JSON reporter (`--format json`).
- `--max-warnings <n>` option to fail the run on too many warnings.
- Exit codes: `0` no errors, `1` errors or too many warnings, `2` invalid usage
  or the site could not be linted.
- Example sites in `examples/good-site` (no findings) and `examples/bad-site`
  (triggers every rule), with end-to-end tests that lint them through the CLI.
- GitHub Actions CI on Node.js 20 and 22: typecheck, ESLint, Prettier, tests and
  build.

[Unreleased]: https://github.com/enekomtz1/onpage-lint/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/enekomtz1/onpage-lint/releases/tag/v0.1.0
