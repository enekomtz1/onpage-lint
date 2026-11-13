# onpage-lint

A command-line linter for on-page SEO. Point it at the build output of a static
site and it reports the problems that keep pages from ranking: missing titles,
duplicate descriptions, broken internal links, images without `alt` text,
invalid JSON-LD and more. It exits with a non-zero code when it finds errors, so
it can gate a deploy in CI.

> Status: early development. The first usable version will be `v0.1.0`.

## Who it is for

Web developers who ship static sites (Next.js static export, Astro, Hugo,
Eleventy, plain HTML) and want on-page SEO checked automatically on every
build instead of by hand before each launch.

## Built with

- TypeScript on Node.js 20+
- [cheerio](https://cheerio.js.org/) for HTML parsing
- Vitest, ESLint and Prettier
- GitHub Actions for CI

It reads local files only. It makes no network requests and needs no API keys.

## Install and run

```bash
git clone https://github.com/enekomtz1/onpage-lint.git
cd onpage-lint
npm install
npm run build
node dist/cli.js path/to/your/site
```

## Development

```bash
npm test          # run the test suite
npm run lint      # ESLint + Prettier check
npm run build     # compile to dist/
```

## Roadmap

See [ROADMAP.md](ROADMAP.md) and the
[`v1.0` milestone](https://github.com/enekomtz1/onpage-lint/milestone/1).

## License

[MIT](LICENSE)
