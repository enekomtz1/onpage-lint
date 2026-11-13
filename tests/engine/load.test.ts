import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { lint, loadSite } from '../../src/engine/index.js';
import type { Rule } from '../../src/types.js';

const fixtureDir = fileURLToPath(new URL('./fixtures/basic-site', import.meta.url));

describe('loadSite with the fixture site', () => {
  it('resolves the root to an absolute path', async () => {
    const relative = path.relative(process.cwd(), fixtureDir);

    const site = await loadSite(relative);

    expect(site.rootDir).toBe(path.resolve(fixtureDir));
  });

  it('lists every file with root-relative forward-slash paths', async () => {
    const site = await loadSite(fixtureDir);

    expect([...site.files].sort()).toEqual([
      'assets/site.css',
      'blog/2026/first-post.HTM',
      'index.html',
    ]);
  });

  it('parses .html and .htm files, case-insensitively, as pages', async () => {
    const site = await loadSite(fixtureDir);

    expect(site.pages.map((page) => page.relativePath)).toEqual([
      'blog/2026/first-post.HTM',
      'index.html',
    ]);
    const post = site.pages[0];
    expect(post?.filePath).toBe(path.join(fixtureDir, 'blog', '2026', 'first-post.HTM'));
    expect(post?.$('title').text()).toBe('Our first post');
    expect(post?.html).toContain('Hello from the oven');
  });
});

describe('loadSite with temporary directories', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'onpage-lint-engine-'));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  async function put(relativePath: string, content = ''): Promise<void> {
    const target = path.join(root, ...relativePath.split('/'));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, 'utf8');
  }

  it('skips node_modules and dot-directories but keeps dotfiles', async () => {
    await put('index.html', '<title>Home</title>');
    await put('node_modules/pkg/readme.html', '<title>Package</title>');
    await put('.git/hooks/sample.html');
    await put('.cache/page.html');
    await put('docs/node_modules/nested.html');
    await put('.nojekyll');

    const site = await loadSite(root);

    expect([...site.files].sort()).toEqual(['.nojekyll', 'index.html']);
    expect(site.pages.map((page) => page.relativePath)).toEqual(['index.html']);
  });

  it('reads pages as UTF-8', async () => {
    await put('café.html', '<title>Crème brûlée</title>');

    const site = await loadSite(root);

    expect(site.pages[0]?.relativePath).toBe('café.html');
    expect(site.pages[0]?.$('title').text()).toBe('Crème brûlée');
  });

  it('returns an empty site for an empty directory', async () => {
    const site = await loadSite(root);

    expect(site.pages).toEqual([]);
    expect(site.files.size).toBe(0);
  });

  it('rejects when the root does not exist', async () => {
    const missing = path.join(root, 'nope');

    await expect(loadSite(missing)).rejects.toThrow(/does not exist/);
  });

  it('rejects when the root is a file', async () => {
    await put('index.html');

    await expect(loadSite(path.join(root, 'index.html'))).rejects.toThrow(/not a directory/);
  });
});

describe('lint', () => {
  it('loads the site and runs the rules', async () => {
    const rule: Rule = {
      id: 'always-warn',
      description: 'Warns on every page.',
      severity: 'warning',
      check: (page) => [{ message: `Saw ${page.relativePath}`, line: 1 }],
    };

    const report = await lint(fixtureDir, [rule]);

    expect(report.rootDir).toBe(path.resolve(fixtureDir));
    expect(report.pagesScanned).toBe(2);
    expect(report.warningCount).toBe(2);
    expect(report.findings.map((finding) => finding.page)).toEqual([
      'blog/2026/first-post.HTM',
      'index.html',
    ]);
  });
});
