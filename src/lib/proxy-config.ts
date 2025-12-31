// Switched back to internal Vercel API routes as per user request
export const PROXY_WORKER_URL = '';

export function getHlsProxyUrl(targetUrl: string, params: Record<string, string> = {}): string {
    const searchParams = new URLSearchParams();
    searchParams.set('url', targetUrl);
    for (const [key, value] of Object.entries(params)) {
        if (value) searchParams.set(key, value);
    }
    // Use local API route
    return `/api/hls?${searchParams.toString()}`;
}

export function getSimpleProxyUrl(targetUrl: string, params: Record<string, string> = {}): string {
    const searchParams = new URLSearchParams();
    searchParams.set('url', targetUrl);
    for (const [key, value] of Object.entries(params)) {
        if (value) searchParams.set(key, value);
    }
    // Use local API route
    return `/api/proxy?${searchParams.toString()}`;
}
