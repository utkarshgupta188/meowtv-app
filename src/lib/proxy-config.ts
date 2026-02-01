// Switched to Cloudflare Worker to avoid Vercel timeouts
// For standalone Tauri builds, we ALWAYS use the Cloudflare Worker
const CF_WORKER_URL = 'https://meowserver.utkarshg.workers.dev';
export const PROXY_WORKER_URL = process.env.NEXT_PUBLIC_CF_WORKER_URL || CF_WORKER_URL;

export function getHlsProxyUrl(targetUrl: string, params: Record<string, string> = {}): string {
    const searchParams = new URLSearchParams();
    searchParams.set('url', targetUrl);
    for (const [key, value] of Object.entries(params)) {
        if (value) searchParams.set(key, value);
    }

    // Use Cloudflare Worker if configured, otherwise fallback to local API
    if (PROXY_WORKER_URL) {
        return `${PROXY_WORKER_URL}/api/hls?${searchParams.toString()}`;
    }
    return `/api/hls?${searchParams.toString()}`;
}

export function getSimpleProxyUrl(targetUrl: string, params: Record<string, string> = {}): string {
    const searchParams = new URLSearchParams();
    searchParams.set('url', targetUrl);
    for (const [key, value] of Object.entries(params)) {
        if (value) searchParams.set(key, value);
    }

    if (PROXY_WORKER_URL) {
        return `${PROXY_WORKER_URL}/api/proxy?${searchParams.toString()}`;
    }
    return `/api/proxy?${searchParams.toString()}`;
}
