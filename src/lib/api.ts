'use server';

import { cookies } from 'next/headers';

import { MeowVerseProvider } from './providers/meowverse';
import { Provider, HomePageRow, ContentItem, MovieDetails, VideoResponse } from './providers/types';

import { MeowTvProvider } from './providers/meowtv';
import { MeowToonProvider } from './providers/meowtoon';

// Registry
const PROVIDERS: Record<string, Provider> = {
    'MeowTV': MeowTvProvider,
    'MeowVerse': MeowVerseProvider,
    'MeowToon': MeowToonProvider
};

const DEFAULT_PROVIDER = 'MeowTV';

type CachedDetails = { value: MovieDetails; expiresAt: number };
type CachedStream = { value: VideoResponse; expiresAt: number };

const DETAILS_CACHE_TTL_MS = 10 * 60 * 1000;
const STREAM_CACHE_TTL_MS = 10 * 60 * 1000;
const detailsCache = new Map<string, CachedDetails>();
const streamCache = new Map<string, CachedStream>();

function getCachedDetails(cacheKey: string): MovieDetails | null {
    const hit = detailsCache.get(cacheKey);
    if (!hit) return null;
    if (Date.now() > hit.expiresAt) {
        detailsCache.delete(cacheKey);
        return null;
    }
    return hit.value;
}

function setCachedDetails(cacheKey: string, value: MovieDetails): void {
    detailsCache.set(cacheKey, { value, expiresAt: Date.now() + DETAILS_CACHE_TTL_MS });
}

function getCachedStream(cacheKey: string): VideoResponse | null {
    const hit = streamCache.get(cacheKey);
    if (!hit) return null;
    if (Date.now() > hit.expiresAt) {
        streamCache.delete(cacheKey);
        return null;
    }
    return hit.value;
}

function setCachedStream(cacheKey: string, value: VideoResponse): void {
    streamCache.set(cacheKey, { value, expiresAt: Date.now() + STREAM_CACHE_TTL_MS });
}

async function getProviderWithName(): Promise<{ providerName: string; provider: Provider }> {
    const cookieStore = await cookies();
    const providerName = cookieStore.get('provider')?.value || DEFAULT_PROVIDER;
    return { providerName, provider: PROVIDERS[providerName] || PROVIDERS[DEFAULT_PROVIDER] };
}

// Global Exported Functions (Facade)

export async function fetchHome(page: number = 1): Promise<HomePageRow[]> {
    const { provider } = await getProviderWithName();
    return provider.fetchHome(page);
}

export async function searchContent(query: string): Promise<ContentItem[]> {
    const { provider } = await getProviderWithName();
    return provider.search(query);
}

export async function fetchDetails(id: string): Promise<MovieDetails | null> {
    const { providerName, provider } = await getProviderWithName();
    const cacheKey = `${providerName}::${id}`;

    try {
        const details = await provider.fetchDetails(id);
        if (details) {
            setCachedDetails(cacheKey, details);
            return details;
        }
    } catch (e) {
        console.error('[api] fetchDetails failed, using cache if available', e);
    }

    return getCachedDetails(cacheKey);
}

export async function fetchStreamUrl(
    movieId: string,
    episodeId: string,
    languageId?: number | string
): Promise<VideoResponse | null> {
    const { providerName, provider } = await getProviderWithName();
    const cacheKey = `${providerName}::${movieId}::${episodeId}::${languageId ?? ''}`;

    try {
        const videoData = await provider.fetchStreamUrl(movieId, episodeId, languageId);
        if (videoData) {
            setCachedStream(cacheKey, videoData);
            return videoData;
        }
    } catch (e) {
        console.error('[api] fetchStreamUrl failed, using cache if available', e);
    }

    return getCachedStream(cacheKey);
}

// Helper to switch provider (Server Action)
export async function setProviderAction(providerName: string) {
    const cookieStore = await cookies();
    cookieStore.set('provider', providerName, { secure: true, httpOnly: true, sameSite: 'strict' });
}

export async function getProviderNameAction(): Promise<string> {
    const cookieStore = await cookies();
    return cookieStore.get('provider')?.value || DEFAULT_PROVIDER;
}
