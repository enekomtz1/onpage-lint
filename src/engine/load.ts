import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { createPage, createSite } from '../page.js';
import type { SiteContext } from '../types.js';
import { isHtmlFile, walkFiles } from './walk.js';

async function assertDirectory(dir: string): Promise<void> {
  let stats;
  try {
    stats = await stat(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Site directory does not exist: ${dir}`, { cause: error });
    }
    throw error;
  }
  if (!stats.isDirectory()) {
    throw new Error(`Site path is not a directory: ${dir}`);
  }
}

/** Finds and parses every HTML file under `rootDir`. */
export async function loadSite(rootDir: string): Promise<SiteContext> {
  const root = path.resolve(rootDir);
  await assertDirectory(root);

  const files = await walkFiles(root);
  const pages = await Promise.all(
    files.filter(isHtmlFile).map(async (relativePath) => {
      const html = await readFile(path.join(root, ...relativePath.split('/')), 'utf8');
      return createPage({ rootDir: root, relativePath, html });
    }),
  );

  return createSite(root, pages, files);
}
