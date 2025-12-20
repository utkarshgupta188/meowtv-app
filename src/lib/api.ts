'use server';

import { cookies } from 'next/headers';

import { MeowVerseProvider } from './providers/meowverse';
import { Provider, HomePageRow, ContentItem, MovieDetails, VideoResponse } from './providers/types';
import { decryptStream } from './enc2';

import { MeowTvProvider } from './providers/meowtv';
import { MeowToonProvider } from './providers/meowtoon';

// Registry
const PROVIDERS: Record<string, Provider> = {
    'MeowTV': MeowTvProvider,
    'MeowVerse': MeowVerseProvider,
    'MeowToon': MeowToonProvider
};

const DEFAULT_PROVIDER = 'MeowTV';

async function getProvider(): Promise<Provider> {
    const cookieStore = await cookies();
    const providerName = cookieStore.get('provider')?.value || DEFAULT_PROVIDER;
    return PROVIDERS[providerName] || PROVIDERS[DEFAULT_PROVIDER];
}

// Global Exported Functions (Facade)

export async function fetchHome(page: number = 1): Promise<HomePageRow[]> {
    const provider = await getProvider();
    return provider.fetchHome(page);
}

export async function searchContent(query: string): Promise<ContentItem[]> {
    const provider = await getProvider();
    return provider.search(query);
}

export async function fetchDetails(id: string): Promise<MovieDetails | null> {
    const provider = await getProvider();
    return provider.fetchDetails(id);
}

export async function fetchStreamUrl(
    movieId: string,
    episodeId: string,
    languageId?: number | string
): Promise<VideoResponse | null> {
    const provider = await getProvider();
    const videoData = await provider.fetchStreamUrl(movieId, episodeId, languageId);

    // If any provider returns an enc2: URL directly, decrypt it here and keep routing through /api/hls.
    if (videoData?.videoUrl?.startsWith('enc2:')) {
        console.log('[enc2] videoUrl from provider contains enc2, decrypting...', {
            movieId,
            episodeId,
            provider: (provider as any)?.name,
        });
        const decrypted = decryptStream(videoData.videoUrl);
        if (decrypted) {
            videoData.videoUrl = `/api/hls?url=${encodeURIComponent(decrypted)}&kind=playlist&decrypt=kartoons`;
            console.log('[enc2] videoUrl decrypted to', decrypted);
        }
    }

    // Also clean up qualities if they contain enc2: URLs
    if (videoData?.qualities?.length) {
        videoData.qualities = videoData.qualities.map(q => {
            if (q.url.startsWith('enc2:')) {
                console.log('[enc2] quality url contains enc2, decrypting...', {
                    movieId,
                    episodeId,
                    provider: (provider as any)?.name,
                });
                const dec = decryptStream(q.url);
                return dec
                    ? { ...q, url: `/api/hls?url=${encodeURIComponent(dec)}&kind=playlist&decrypt=kartoons` }
                    : q;
            }
            return q;
        });
    }

    return videoData;
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
