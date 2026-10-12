import type { CollectionEntry } from 'astro:content';

/**
 * Draft posts are available while running the local dev server, but are
 * excluded from production pages, tag archives, RSS, and Pagefind output.
 */
export function isPostVisible({ data }: CollectionEntry<'blog'>) {
  return import.meta.env.DEV || !data.draft;
}
