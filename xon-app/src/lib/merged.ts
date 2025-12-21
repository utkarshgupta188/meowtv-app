import type { ContentItem, Details, HomeRow, StreamResponse } from './types';

import { fetchDetails as fetchXonDetails, fetchHome as fetchXonHome, fetchStream as fetchXonStream, search as searchXon } from './xon';
import { KartoonsProvider } from './providers/kartoons';

export async function fetchMergedHome(): Promise<HomeRow[]> {
  const [xonRows, kartoRows] = await Promise.all([
    fetchXonHome().catch((e) => {
      console.error('[merged] xon home failed', e);
      return [] as HomeRow[];
    }),
    KartoonsProvider.fetchHome().catch((e) => {
      console.error('[merged] karto home failed', e);
      return [] as HomeRow[];
    }),
  ]);

  // Keep them as separate sections but on the same homepage.
  return [...xonRows.map((r) => ({ ...r, name: `Xon • ${r.name}` })), ...kartoRows];
}

export async function searchMerged(query: string): Promise<ContentItem[]> {
  const [xon, karto] = await Promise.all([
    searchXon(query).catch((e) => {
      console.error('[merged] xon search failed', e);
      return [] as ContentItem[];
    }),
    KartoonsProvider.search(query).catch((e) => {
      console.error('[merged] karto search failed', e);
      return [] as ContentItem[];
    }),
  ]);

  // Merge + de-dupe by id.
  const out: ContentItem[] = [];
  const seen = new Set<string>();
  for (const item of [...xon, ...karto]) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

export async function fetchMergedDetails(id: string): Promise<Details | null> {
  if (id.startsWith('kartoons:')) return KartoonsProvider.fetchDetails(id);
  return fetchXonDetails(id);
}

export async function fetchMergedStream(id: string): Promise<StreamResponse | null> {
  if (id.startsWith('kartoons:')) return KartoonsProvider.fetchStream(id);
  return fetchXonStream(id);
}
