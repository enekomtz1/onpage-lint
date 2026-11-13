# onpage-lint

[![CI](https://github.com/enekomtz1/onpage-lint/actions/workflows/ci.yml/badge.svg)](https://github.com/enekomtz1/onpage-lint/actions/workflows/ci.yml)

A command-line linter for on-page SEO. Point it at the build output of a static
site and it reports the problems that keep pages from ranking: missing titles,
duplicate descriptions, broken internal links, images without `alt` text,
invalid JSON-LD and more. It exits with a non-zero code when it finds errors, so
it can gate a deploy in CI.

The current version is **v0.1.0**, the first release.

## What it does

`onpage-lint` finds every `.html` and `.htm` file under the directory you give
it, parses each one and runs [10 rules](#rules) against it. Some rules look
across the whole site: duplicate titles and descriptions are compared between
pages, and internal links are resolved against the files that actually exist in
the build. Every finding has a page, a line number when one is known, a
severity (`error` or `warning`) and the id of the rule that produced it.

It reads local files only. It makes no network requests, needs no API keys and
does not run the JavaScript on your pages, so it sees exactly the HTML your
static site generator wrote to disk.

## Who it is for

Web developers who ship static sites (Next.js static export, Astro, Hugo,
Eleventy, plain HTML) and want on-page SEO checked automatically on every
build instead of by hand before each launch.

## Built with

- TypeScript on Node.js 20+
- [cheerio](https://cheerio.js.org/) for HTML parsing
- Vitest, ESLint and Prettier
- GitHub Actions for CI

## Install and run

`onpage-lint` is not published on npm yet. For now, run it from a clone of
this repository (requires Node.js 20 or newer):

```bash
git clone https://github.com/enekomtz1/onpage-lint.git
cd onpage-lint
npm install
npm run build
node dist/cli.js path/to/your/site
```

`path/to/your/site` is the build output folder of your site, for example
`out/` for a Next.js static export or `dist/` for Astro.

## Usage

```text
onpage-lint <dir> [options]
```

| Option                  | Description                                             |
| ----------------------- | ------------------------------------------------------- |
| `-f`, `--format <name>` | Output format: `text` (default) or `json`.              |
| `--max-warnings <n>`    | Exit with code 1 when there are more than `n` warnings. |
| `-h`, `--help`          | Show the help and exit.                                 |
| `-v`, `--version`       | Show the version number and exit.                       |

Exactly one directory is required. `node_modules` and directories whose name
starts with a dot are skipped, and symbolic links are not followed.

### Exit codes

| Code | Meaning                                                               |
| ---- | --------------------------------------------------------------------- |
| `0`  | No errors found (warnings alone do not fail the run).                 |
| `1`  | At least one error, or more warnings than `--max-warnings` allows.    |
| `2`  | Invalid usage, or the site could not be linted (e.g. missing folder). |

### Text output

This is the real output of `node dist/cli.js examples/bad-site` (the JSON
syntax error message comes from Node.js and its wording varies between Node
versions):

```text
about/index.html
   -  warning  Missing <link rel="canonical"> in <head>.                                                                  canonical
   2  warning  lang="english" does not look like a valid BCP 47 language tag.                                             html-lang
   5  warning  Viewport content "initial-scale=1" does not include width=device-width.                                    viewport
   6  warning  <meta name="robots" content="noindex, follow"> keeps this page out of search results.                      robots-noindex
   7  warning  Title "Larkspur Clay Studio" is also used by blog/opening-week.html.                                       title
   8  warning  Meta description is 9 characters long; aim for 50 to 160.                                                  meta-description
  10  warning  JSON-LD object has no @context.                                                                            json-ld
  17  warning  Page has more than one <h1> (first on line 15).                                                            h1

blog/opening-week.html
   -  error    Page has no <h1>.                                                                                          h1
   6  warning  Title "Larkspur Clay Studio" is also used by about/index.html.                                             title
  11  error    Found 2 <meta name="description"> elements; expected exactly one.                                          meta-description
  22  error    Internal link "../../index.html" points above the site root.                                               internal-links
  23  error    Broken internal link "../classes/": classes/index.html does not exist.                                     internal-links

index.html
   -  error    Missing <meta name="description"> in <head>.                                                               meta-description
   -  error    Missing <meta name="viewport"> in <head>.                                                                  viewport
   2  error    <html> has no lang attribute.                                                                              html-lang
   5  warning  Title is 4 characters long; aim for 10 to 60.                                                              title
   6  error    Canonical href "/index.html" is not an absolute http(s) URL.                                               canonical
   8  error    JSON-LD is not valid JSON: Expected double-quoted property name in JSON at position 131 (line 6 column 7)  json-ld
  18  error    <img src="/assets/logo.svg"> has no alt attribute.                                                         img-alt
  22  error    Broken internal link "/contact.html": contact.html does not exist.                                         internal-links

11 errors, 10 warnings in 3 pages
```

Each block is a page; each row shows the line (`-` when the problem is not tied
to a line, such as a missing tag), the severity, the message and the rule id.
A clean site prints `No problems found in 4 pages.`

### JSON output

`--format json` prints a single JSON object, useful for scripts and other tools:

```json
{
  "rootDir": "/home/you/onpage-lint/examples/bad-site",
  "pagesScanned": 3,
  "errorCount": 11,
  "warningCount": 10,
  "findings": [
    {
      "page": "about/index.html",
      "ruleId": "canonical",
      "severity": "warning",
      "message": "Missing <link rel=\"canonical\"> in <head>."
    },
    {
      "page": "about/index.html",
      "line": 2,
      "ruleId": "html-lang",
      "severity": "warning",
      "message": "lang=\"english\" does not look like a valid BCP 47 language tag."
    }
  ]
}
```

The `findings` array is shortened here. `line` is omitted when it is not known.

### In CI

Because errors make the command exit with code 1, adding it after your build
step is enough to fail the pipeline:

```bash
npm run build                                   # your site's build
node path/to/onpage-lint/dist/cli.js out --max-warnings 0
```

## Rules

All 10 rules run on every page; there is no configuration file in v0.1.0. See
[docs/rules.md](docs/rules.md) for the exact conditions and a failing and a
passing example for each rule.

| Rule id            | What it checks                                                                | Errors                                                | Warnings                                      |
| ------------------ | ----------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------- |
| `title`            | One non-empty `<title>`, 10–60 characters, unique in the site                 | missing, several, empty                               | too short or long, duplicated on another page |
| `meta-description` | One non-empty meta description, 50–160 characters, unique in the site         | missing, several, empty                               | too short or long, duplicated on another page |
| `canonical`        | One `<link rel="canonical">` with an absolute `http(s)` URL                   | several, empty `href`, relative or non-http URL       | missing                                       |
| `html-lang`        | `<html lang>` is present and looks like a BCP 47 tag                          | missing, empty                                        | not a plausible language tag                  |
| `viewport`         | A viewport meta tag with `width=device-width`                                 | missing                                               | no `width=device-width`                       |
| `robots-noindex`   | Robots meta tags (`robots`, `googlebot`) that contain `noindex` or `none`     | none                                                  | page is kept out of search results            |
| `h1`               | Exactly one `<h1>`, with text                                                 | no `<h1>`, empty `<h1>`                               | more than one `<h1>`                          |
| `img-alt`          | Every `<img>` has an `alt` attribute (empty is fine for decorative images)    | `alt` attribute missing                               | none                                          |
| `internal-links`   | Every internal `<a href>` points to a file that exists in the site            | target missing, above the site root, invalid encoding | none                                          |
| `json-ld`          | JSON-LD blocks are valid JSON objects with `@context` and `@type` or `@graph` | empty, invalid JSON, not an object                    | no `@context`, no `@type`/`@graph`            |

## Try it

The repository includes two small example sites for an invented pottery studio,
each with a nested directory, a stylesheet and an image:

- [`examples/good-site`](examples/good-site) follows every rule and produces no
  findings.
- [`examples/bad-site`](examples/bad-site) breaks every rule at least once.

After `npm install` and `npm run build`:

```bash
node dist/cli.js examples/good-site                 # No problems found in 4 pages.
node dist/cli.js examples/bad-site                  # 11 errors, 10 warnings, exit code 1
node dist/cli.js examples/bad-site --format json
```

## Development

```bash
npm install         # install dependencies
npm run build       # compile src/ to dist/
npm test            # run the test suite (unit and end-to-end)
npm run test:watch  # run the tests in watch mode
npm run typecheck   # type-check src/ and tests/
npm run lint        # ESLint + Prettier check
npm run format      # format the code with Prettier
```

The end-to-end tests in `tests/e2e/` run the CLI on the example sites. Design
decisions are recorded in [DECISIONS.md](DECISIONS.md) and changes in
[CHANGELOG.md](CHANGELOG.md).

## Roadmap

The road to v1.0.0 is planned as 18 issues (an estimated 40 hours) in the
[`v1.0` milestone](https://github.com/enekomtz1/onpage-lint/milestone/1),
summarized in [ROADMAP.md](ROADMAP.md):

- A config file with per-rule severity, options and ignored paths
- New rules: `heading-order`, `open-graph`, `hreflang`, `sitemap`, `robots-txt`
  and `internal-assets`, plus browser-accurate link resolution
- Columns and source snippets in findings
- HTML and SARIF reports, and a coloured text report
- A reusable GitHub Action, publication on npm and a documentation site

## License

[MIT](LICENSE)
