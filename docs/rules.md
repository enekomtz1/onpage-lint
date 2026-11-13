# Rules

`onpage-lint` v0.1.0 ships 10 rules. Every rule runs on every HTML page (`.html`
or `.htm`) found under the directory you lint. All rules are on; there is no
configuration file yet.

Each finding has a severity:

- **error**: makes the CLI exit with code 1.
- **warning**: reported, but only fails the run when you pass `--max-warnings`.

Lengths are counted in Unicode code points after trimming surrounding
whitespace, so an emoji or an accented letter counts as one character.

- [title](#title)
- [meta-description](#meta-description)
- [canonical](#canonical)
- [html-lang](#html-lang)
- [viewport](#viewport)
- [robots-noindex](#robots-noindex)
- [h1](#h1)
- [img-alt](#img-alt)
- [internal-links](#internal-links)
- [json-ld](#json-ld)

## title

**Checks:** the page has exactly one non-empty `<title>` in `<head>`, of a
sensible length, and no other page in the site uses the same title.

**Why it matters:** the title is the main signal of what a page is about and is
usually the clickable headline in search results. Missing or duplicated titles
make pages hard to tell apart; very long ones are cut off.

| Condition                                              | Severity |
| ------------------------------------------------------ | -------- |
| No `<title>` in `<head>`                               | error    |
| More than one `<title>` in `<head>`                    | error    |
| `<title>` is empty or only whitespace                  | error    |
| Title shorter than 10 or longer than 60 characters     | warning  |
| Another page has exactly the same title (case matters) | warning  |

When there are several `<title>` elements, the length and duplicate checks use
the first one.

Failing:

```html
<head>
  <title>Home</title>
</head>
```

Passing:

```html
<head>
  <title>Pottery classes for beginners | Larkspur Clay Studio</title>
</head>
```

## meta-description

**Checks:** the page has exactly one non-empty `<meta name="description">` in
`<head>`, of a sensible length, and no other page uses the same description.

**Why it matters:** search engines often show the description as the snippet
under the title. A clear, unique description helps people choose your result.

| Condition                                                    | Severity |
| ------------------------------------------------------------ | -------- |
| No `<meta name="description">` in `<head>`                   | error    |
| More than one `<meta name="description">`                    | error    |
| `content` is missing, empty or only whitespace               | error    |
| Description shorter than 50 or longer than 160 characters    | warning  |
| Another page has exactly the same description (case matters) | warning  |

The `name` attribute is matched case-insensitively. With several description
tags, the length and duplicate checks use the first one.

Failing:

```html
<meta name="description" content="About us." />
```

Passing:

```html
<meta
  name="description"
  content="How the studio started, what the workshop looks like and why classes stay small."
/>
```

## canonical

**Checks:** the page declares one canonical URL with `<link rel="canonical">`
in `<head>`, and its `href` is an absolute `http:` or `https:` URL.

**Why it matters:** the canonical URL tells search engines which address is the
preferred one when the same content is reachable at several URLs, so ranking
signals are not split between duplicates. Relative canonicals are easy to get
wrong and are a common source of indexing mistakes.

| Condition                                      | Severity |
| ---------------------------------------------- | -------- |
| No `<link rel="canonical">` in `<head>`        | warning  |
| More than one `<link rel="canonical">`         | error    |
| `href` is missing, empty or only whitespace    | error    |
| `href` is not an absolute `http:`/`https:` URL | error    |

`rel` is matched as a space-separated token list, case-insensitively. The rule
does not check that the canonical URL matches the page's own location.

Failing:

```html
<link rel="canonical" href="/about/" />
```

Passing:

```html
<link rel="canonical" href="https://www.example.com/about/" />
```

## html-lang

**Checks:** the `<html>` element has a `lang` attribute that looks like a valid
BCP 47 language tag.

**Why it matters:** the declared language helps search engines serve the page to
the right audience, and screen readers use it to pick a pronunciation.

| Condition                                       | Severity |
| ----------------------------------------------- | -------- |
| `<html>` has no `lang` attribute                | error    |
| `lang` is empty or only whitespace              | error    |
| `lang` does not look like a BCP 47 language tag | warning  |

The format check is a plausibility check, not a full validator: a 2–3 letter
language code followed by optional `-`-separated subtags of 2–8 letters or
digits (pattern `^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$`). `en`, `en-GB` and
`zh-Hant-TW` pass; `english` and `en_US` produce a warning.

Failing:

```html
<html lang="english"></html>
```

Passing:

```html
<html lang="en-GB"></html>
```

## viewport

**Checks:** the page has a `<meta name="viewport">` in `<head>` whose `content`
includes `width=device-width`.

**Why it matters:** search engines index the mobile version of a page. Without a
device-width viewport, mobile browsers render a zoomed-out desktop layout.

| Condition                                       | Severity |
| ----------------------------------------------- | -------- |
| No `<meta name="viewport">` in `<head>`         | error    |
| `content` does not include `width=device-width` | warning  |

`width=device-width` is matched case-insensitively and ignoring spaces, among
pairs separated by commas or semicolons. Only the first viewport tag is
checked.

Failing:

```html
<meta name="viewport" content="initial-scale=1" />
```

Passing:

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

## robots-noindex

**Checks:** flags pages that a robots meta tag keeps out of search results.

**Why it matters:** a `noindex` left over from a staging build silently removes
pages from search. This rule makes it visible; if the page is meant to be
hidden, you can ignore the warning.

| Condition                                                                                              | Severity |
| ------------------------------------------------------------------------------------------------------ | -------- |
| A `<meta name="robots">` or `<meta name="googlebot">` in `<head>` has `noindex` or `none` in `content` | warning  |

One warning per matching tag. Names and directives are matched
case-insensitively, and directives may be separated by commas or spaces. `none`
counts because it means `noindex, nofollow`. The `X-Robots-Tag` HTTP header is
not visible to a file-based linter and is not checked.

Failing:

```html
<meta name="robots" content="noindex, follow" />
```

Passing:

```html
<meta name="robots" content="index, follow" />
```

## h1

**Checks:** each page has exactly one `<h1>`, and it has text.

**Why it matters:** the main heading tells readers and search engines what the
page is about. Pages without one lose that signal; several competing `<h1>`s
blur it.

| Condition                         | Severity                       |
| --------------------------------- | ------------------------------ |
| The page has no `<h1>`            | error                          |
| An `<h1>` has no text             | error                          |
| The page has more than one `<h1>` | warning (one per extra `<h1>`) |

An `<h1>` whose only content is an `<img>` with a non-empty `alt` counts as
having text.

Failing:

```html
<body>
  <p><strong>Opening week</strong></p>
</body>
```

Passing:

```html
<body>
  <h1>Opening week</h1>
</body>
```

## img-alt

**Checks:** every `<img>` has an `alt` attribute.

**Why it matters:** search engines use `alt` text to understand images, and
screen reader users depend on it. Decorative images should still have
`alt=""` so they are skipped.

| Condition                                | Severity |
| ---------------------------------------- | -------- |
| An `<img>` has no `alt` attribute at all | error    |

An empty `alt=""` passes. Images with `role="presentation"`, `role="none"` or
`aria-hidden="true"` are skipped. The rule does not judge the quality of the
`alt` text.

Failing:

```html
<img src="/assets/logo.svg" />
```

Passing:

```html
<img src="/assets/logo.svg" alt="Larkspur Clay Studio logo" />
<img src="/assets/divider.svg" alt="" />
```

## internal-links

**Checks:** every internal `<a href>` points to a file that exists in the site.

**Why it matters:** broken internal links waste crawl budget, stop link value
from flowing between pages and send visitors to a 404.

| Condition                                               | Severity |
| ------------------------------------------------------- | -------- |
| The link target does not exist under the site root      | error    |
| The link goes above the site root (too many `../`)      | error    |
| The path has invalid percent-encoding (e.g. `%E0%A4%A`) | error    |

How links are resolved:

- Skipped: empty `href`, fragment-only links (`#top`), links with a scheme
  (`https:`, `mailto:`, `tel:`, …) and protocol-relative links (`//host/…`).
- The query string and fragment are removed, then the path is percent-decoded.
- Paths starting with `/` are resolved from the site root; others from the
  page's directory.
- A path ending in `/` must have an `index.html` in that directory.
- Any other path `x` passes if `x`, `x/index.html` or `x.html` exists.

Limitations in v0.1.0:

- Only `<a href>` is checked, not `<img src>`, `<link href>` or scripts.
- Fragments are not checked against element ids.
- `<base href>` is ignored: relative links are always resolved from the page's
  own directory.
- Files inside dot-directories (such as `.well-known/`) are not seen by the
  linter, so links to them are reported as broken.

Failing (no `contact.html` in the site):

```html
<a href="/contact.html">Contact</a>
```

Passing (`classes/index.html` exists):

```html
<a href="/classes/">Classes</a>
```

## json-ld

**Checks:** every `<script type="application/ld+json">` block contains valid
JSON-LD: a JSON object (or a non-empty array of objects) with `@context` and
either `@type` or `@graph`.

**Why it matters:** structured data makes pages eligible for rich results. A
syntax error makes search engines ignore the whole block.

| Condition                                                  | Severity |
| ---------------------------------------------------------- | -------- |
| The block is empty or only whitespace                      | error    |
| The block is not valid JSON                                | error    |
| The value is not an object or a non-empty array of objects | error    |
| A top-level object has no `@context`                       | warning  |
| A top-level object has neither `@type` nor `@graph`        | warning  |

The `type` attribute is matched case-insensitively. For arrays, each item is
checked on its own. Objects nested inside `@graph` are not checked, and the
rule does not validate against the schema.org vocabulary.

Failing (trailing comma):

```html
<script type="application/ld+json">
  { "@context": "https://schema.org", "@type": "LocalBusiness", "name": "Larkspur" }
</script>
```

Passing:

```html
<script type="application/ld+json">
  { "@context": "https://schema.org", "@type": "LocalBusiness", "name": "Larkspur" }
</script>
```
