// Use Cloudflare Worker for all proxied requests
const CF_WORKER_URL = 'https://meowtvserver.utkarshg.workers.dev';
export const PROXY_WORKER_URL = CF_WORKER_URL;

export function getHlsProxyUrl(targetUrl: string, params: Record<string, string> = {}): string {
    const searchParams = new URLSearchParams();
    searchParams.set('url', targetUrl);
    for (const [key, value] of Object.entries(params)) {
        if (value) searchParams.set(key, value);
    }
    return `${CF_WORKER_URL}/api/hls?${searchParams.toString()}`;
}

export function getSimpleProxyUrl(targetUrl: string, params: Record<string, string> = {}): string {
    const searchParams = new URLSearchParams();
    searchParams.set('url', targetUrl);
    for (const [key, value] of Object.entries(params)) {
        if (value) searchParams.set(key, value);
    }
    return `${CF_WORKER_URL}/api/proxy?${searchParams.toString()}`;
}
