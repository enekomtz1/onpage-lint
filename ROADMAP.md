# Roadmap

## v0.1.0 — working base (released)

- [x] Walk a directory and parse every HTML file
- [x] Head rules: `title`, `meta-description`, `canonical`, `html-lang`, `viewport`, `robots-noindex`
- [x] Content rules: `h1`, `img-alt`, `internal-links`, `json-ld`
- [x] Text and JSON reporters, non-zero exit code on errors
- [x] Tests, linting and CI on every push

## v1.0.0

The work left before the first stable release is tracked in the
[`v1.0` milestone](https://github.com/enekomtz1/onpage-lint/milestone/1): 18 issues,
an estimated 40 hours in total. Each issue has acceptance criteria and its own
estimate. They are listed here in the order they will be worked.

| Issue                                                     | Title                                                                       | Type                  | Hours  |
| --------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------- | ------ |
| [#1](https://github.com/enekomtz1/onpage-lint/issues/1)   | Consolidate test fixtures, measure coverage and run CI on Windows and macOS | testing, ci           | 2      |
| [#2](https://github.com/enekomtz1/onpage-lint/issues/2)   | Add columns and source snippets to findings                                 | refactor, enhancement | 2      |
| [#3](https://github.com/enekomtz1/onpage-lint/issues/3)   | Flag rule crashes and keep linting when a file cannot be read               | enhancement           | 1      |
| [#4](https://github.com/enekomtz1/onpage-lint/issues/4)   | Add rule options and a once-per-site prepare hook                           | refactor              | 3      |
| [#5](https://github.com/enekomtz1/onpage-lint/issues/5)   | Load a config file with per-rule severity, options and ignored paths        | feature               | 4      |
| [#6](https://github.com/enekomtz1/onpage-lint/issues/6)   | Resolve internal links like a browser and check asset references            | enhancement, feature  | 3      |
| [#7](https://github.com/enekomtz1/onpage-lint/issues/7)   | Add the heading-order rule                                                  | feature               | 1      |
| [#8](https://github.com/enekomtz1/onpage-lint/issues/8)   | Add the open-graph rule                                                     | feature               | 1      |
| [#9](https://github.com/enekomtz1/onpage-lint/issues/9)   | Add the hreflang rule                                                       | feature               | 3      |
| [#10](https://github.com/enekomtz1/onpage-lint/issues/10) | Support site-level rules and add the sitemap rule                           | feature, refactor     | 4      |
| [#11](https://github.com/enekomtz1/onpage-lint/issues/11) | Add the robots-txt rule                                                     | feature               | 2      |
| [#12](https://github.com/enekomtz1/onpage-lint/issues/12) | Colour the text report and add an --output option                           | enhancement           | 1      |
| [#13](https://github.com/enekomtz1/onpage-lint/issues/13) | Add an HTML reporter                                                        | feature               | 2      |
| [#14](https://github.com/enekomtz1/onpage-lint/issues/14) | Add a SARIF reporter                                                        | feature               | 2      |
| [#15](https://github.com/enekomtz1/onpage-lint/issues/15) | Document every rule and publish the docs on GitHub Pages                    | documentation, ci     | 4      |
| [#16](https://github.com/enekomtz1/onpage-lint/issues/16) | Prepare the package and publish it to npm                                   | ci                    | 2      |
| [#17](https://github.com/enekomtz1/onpage-lint/issues/17) | Ship a reusable GitHub Action                                               | ci, feature           | 2      |
| [#18](https://github.com/enekomtz1/onpage-lint/issues/18) | Release v1.0.0                                                              | documentation         | 1      |
|                                                           | **Total**                                                                   |                       | **40** |

Work discovered along the way is opened as a new issue in the milestone before
it is started.
