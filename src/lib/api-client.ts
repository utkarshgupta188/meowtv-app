/**
 * Client-side API module for standalone Tauri builds
 * No server-side features (cookies, etc.) - all runs in the browser
 */

import { MeowVerseProvider } from './providers/meowverse';
import { Provider, HomePageRow, ContentItem, MovieDetails, VideoResponse } from './providers/types';
import { MeowTvProvider } from './providers/meowtv';
import { MeowToonProvider } from './providers/meowtoon';
import { fetchDetails as fetchXonDetails, fetchStream as fetchXonStream } from './xon';

// Registry
const PROVIDERS: Record<string, Provider> = {
    'MeowTV': MeowTvProvider,
    'MeowVerse': MeowVerseProvider,
    'MeowToon': MeowToonProvider,
};

const DEFAULT_PROVIDER = 'MeowTV';

// Client-side provider storage (uses both cookie and localStorage for reliability)
const PROVIDER_STORAGE_KEY = 'meowtv_provider';

export function getProviderFromCookie(): string {
    if (typeof window === 'undefined') return DEFAULT_PROVIDER;

    // Try localStorage first (more reliable in WebView contexts)
    const stored = localStorage.getItem(PROVIDER_STORAGE_KEY);
    if (stored && PROVIDERS[stored]) {
        return stored;
    }

    // Fallback to cookie
    const match = document.cookie.match(/provider=([^;]+)/);
    const result = match && PROVIDERS[match[1]] ? match[1] : DEFAULT_PROVIDER;
    return result;
}

export function setProviderCookie(providerName: string): void {
    if (typeof window === 'undefined') return;

    // Store in both localStorage and cookie for reliability
    localStorage.setItem(PROVIDER_STORAGE_KEY, providerName);
    document.cookie = `provider=${providerName};path=/;max-age=31536000`;
}

export function loadProvider(providerName: string): Provider {
    return PROVIDERS[providerName] || PROVIDERS[DEFAULT_PROVIDER];
}

function resolveProviderForId(id: string, fallbackName: string): { providerName: string; provider: Provider } {
    if (id.startsWith('xon:')) {
        return { providerName: 'MeowToon', provider: PROVIDERS['MeowToon'] };
    }
    return { providerName: fallbackName, provider: PROVIDERS[fallbackName] || PROVIDERS[DEFAULT_PROVIDER] };
}

// Caching
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

// API Functions

export async function fetchHomeClient(page: number = 1): Promise<HomePageRow[]> {
    const providerName = getProviderFromCookie();
    const provider = loadProvider(providerName);
    return provider.fetchHome(page);
}

export async function searchContentClient(query: string): Promise<ContentItem[]> {
    const providerName = getProviderFromCookie();
    const provider = loadProvider(providerName);
    return provider.search(query);
}

export async function fetchDetailsClient(id: string, includeEpisodes: boolean = true): Promise<MovieDetails | null> {
    
    if (id.startsWith('xon:')) {
        const cacheKey = `XON_V2::${id}`; // Changed cache version to force refresh
        const cached = getCachedDetails(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            let rawId = id.slice('xon:'.length);
            
            const details = await fetchXonDetails(rawId);
            
            if (details) {
                const episodes = (details.episodes || []).map((ep: any) => ({
                    id: `xon:${ep.id}`,
                    title: ep.title,
                    number: ep.episode ?? ep.number ?? 0,
                    season: ep.season ?? 1,
                    coverImage: ep.poster || undefined,
                    description: ep.description,
                    sourceMovieId: `xon:${details.id}`,
                }));

                // If the ID was an episode and we have no episode list, synthesize a single episode entry.
                const isEpisodeId = rawId.startsWith('episode:');
                
                const synthEpisodes = isEpisodeId && episodes.length === 0
                    ? [{
                        id,
                        title: details.title,
                        number: (details as any).episodeNumber ?? 1,
                        season: (details as any).seasonNumber ?? 1,
                        coverImage: details.poster || undefined,
                        description: details.description,
                        sourceMovieId: (details as any).showId ?? id,
                    }]
                    : undefined;

                const mapped: MovieDetails = {
                    id: `xon:${details.id}`,
                    title: details.title,
                    description: details.description,
                    coverImage: details.poster || '',
                    backgroundImage: details.backdrop || undefined,
                    episodes: episodes.length ? episodes : synthEpisodes,
                    seasons: undefined,
                    tags: undefined,
                };
                setCachedDetails(cacheKey, mapped);
                return mapped;
            }
        } catch (e) {
            // Silently fail and continue
        }
    }

    const providerName = getProviderFromCookie();
    const { provider } = resolveProviderForId(id, providerName);
    const cacheKey = `${providerName}::${id}`;

    const cached = getCachedDetails(cacheKey);
    if (cached) return cached;

    try {
        const details = await provider.fetchDetails(id, includeEpisodes);
        if (details) {
            setCachedDetails(cacheKey, details);
            return details;
        }
    } catch (e) {
        // Silently fail
    }

    return null;
}

export async function fetchStreamClient(
    movieId: string,
    episodeId: string,
    languageId?: number | string
): Promise<VideoResponse | null> {
    if (episodeId.startsWith('xon:') || movieId.startsWith('xon:')) {
        const cacheKey = `XON::${movieId}::${episodeId}::${languageId ?? ''}`;
        const cached = getCachedStream(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const targetId = (episodeId || movieId).replace(/^xon:/, '');
            const stream = await fetchXonStream(targetId);
            if (stream) {
                const mapped: VideoResponse = {
                    videoUrl: stream.qualities?.[0]?.url || '',
                    qualities: stream.qualities?.map((q) => ({ quality: q.label, url: q.url })) || [],
                    subtitles: [],
                    headers: {},
                };
                setCachedStream(cacheKey, mapped);
                return mapped;
            }
        } catch (e) {
            // Silently fail
        }
    }

    const providerName = getProviderFromCookie();
    const hintId = episodeId || movieId;
    const { provider } = resolveProviderForId(hintId, providerName);
    const cacheKey = `${providerName}::${movieId}::${episodeId}::${languageId ?? ''}`;

    const cached = getCachedStream(cacheKey);
    if (cached) return cached;

    try {
        const videoData = await provider.fetchStreamUrl(movieId, episodeId, languageId);
        if (videoData) {
            setCachedStream(cacheKey, videoData);
            return videoData;
        }
    } catch (e) {
        // Silently fail
    }

    return null;
}
