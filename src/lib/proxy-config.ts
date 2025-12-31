export const PROXY_WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'https://you-need-to-set-NEXT_PUBLIC_WORKER_URL-in-env-local';

export function getHlsProxyUrl(targetUrl: string, params: Record<string, string> = {}): string {
    const searchParams = new URLSearchParams();
    searchParams.set('url', targetUrl);
    for (const [key, value] of Object.entries(params)) {
        if (value) searchParams.set(key, value);
    }
    return `${PROXY_WORKER_URL}/api/hls?${searchParams.toString()}`;
}

export function getSimpleProxyUrl(targetUrl: string, params: Record<string, string> = {}): string {
    const searchParams = new URLSearchParams();
    searchParams.set('url', targetUrl);
    for (const [key, value] of Object.entries(params)) {
        if (value) searchParams.set(key, value);
    }
    return `${PROXY_WORKER_URL}/api/proxy?${searchParams.toString()}`;
}
