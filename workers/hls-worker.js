/**
 * HLS Proxy Worker for Cloudflare
 * 
 * This worker mirrors the functionality of the Next.js API route proxy.
 * It handles:
 * 1. Fetching upstream playlists/segments
 * 2. Rewriting M3U8 manifests to point back to this worker
 * 3. Handling headers (Referer, Cookie, User-Agent)
 * 4. CORS support
 */

export default {
    async fetch(request, env, ctx) {
        // Handle CORS preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Range, Authorization',
                    'Access-Control-Max-Age': '86400',
                },
            });
        }

        const urlObj = new URL(request.url);
        const params = urlObj.searchParams;

        // Path routing
        if (urlObj.pathname === '/api/hls') {
            return handleHlsRequest(request, params);
        } else if (urlObj.pathname === '/api/proxy') {
            return handleProxyRequest(request, params);
        }

        return new Response('Usage: /api/hls?url=... or /api/proxy?url=...', { status: 400 });
    }
};

async function handleHlsRequest(request, params) {
    const url = params.get('url');
    const concat = params.get('concat'); // url1|url2|url3
    const referer = params.get('referer') || 'https://net51.cc/';
    const cookie = params.get('cookie') || 'hd=on';
    const decryptParam = params.get('decrypt');
    const kindParam = (params.get('kind') || '').toLowerCase(); // 'playlist' | 'seg'
    const proxySegments = params.get('proxy_segments') !== 'false';
    const rangeHeader = request.headers.get('range');
    const uaParam = params.get('ua');

    const headers = {
        'User-Agent': uaParam || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': referer,
        'Cookie': cookie
    };

    // 1. Handle Concat Request (Merged Segments)
    if (concat) {
        if (!proxySegments) {
            return new Response('Segment proxying disabled', { status: 400 });
        }
        try {
            const urls = concat.split('|');
            if (urls.length > 20) return new Response('Too many segments', { status: 400 });

            // Fetch all segments in parallel
            const responses = await Promise.all(urls.map(u => fetch(u, { headers }).then(r => {
                if (!r.ok) throw new Error(`Failed to fetch ${u}`);
                return r.arrayBuffer();
            })));

            // Merge bodies
            const totalLength = responses.reduce((acc, b) => acc + b.byteLength, 0);
            const merged = new Uint8Array(totalLength);
            let offset = 0;
            for (const b of responses) {
                merged.set(new Uint8Array(b), offset);
                offset += b.byteLength;
            }

            return new Response(merged, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=31536000',
                    'Content-Type': 'video/MP2T'
                }
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: 'Concat failed: ' + error.message }), { status: 500 });
        }
    }

    if (!url) {
        return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        if (rangeHeader) {
            headers['Range'] = rangeHeader;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            return new Response(JSON.stringify({ error: 'Failed to fetch', status: response.status }), {
                status: response.status,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        const contentType = response.headers.get('content-type') || '';
        const contentLength = Number(response.headers.get('content-length') || '0') || 0;

        const forceSeg = kindParam === 'seg';
        const forcePlaylist = kindParam === 'playlist';

        // ... Sniffing logic ...
        // RELAXED CHECK: If it's small enough, read it as text to check for errors/playlist
        // This bypasses strict Content-Type checks which might be missing/wrong
        const canSniffText = !forceSeg &&
            !isProbablySegmentUrl(url) &&
            (contentLength === 0 || contentLength <= 2_000_000);

        let playlistText = null;
        if (forcePlaylist || url.toLowerCase().includes('.m3u8') || /mpegurl|m3u8/i.test(contentType)) {
            playlistText = await response.text();

            // DEBUG: Check for error page disguised as playlist
            if (!playlistText.includes('#EXTM3U')) {
                return new Response(JSON.stringify({
                    error: 'Invalid M3U8 content (upstream 200 OK)',
                    contentType,
                    preview: playlistText.slice(0, 500)
                }), {
                    status: 502,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

        } else if (canSniffText) {
            const probeText = await response.clone().text().catch(() => null);
            if (probeText && probeText.includes('#EXTM3U')) {
                playlistText = probeText;
            } else if (probeText && (probeText.includes('Error') || probeText.includes('Denied') || probeText.startsWith('<html'))) {
                // It's an error page
                return new Response(JSON.stringify({
                    error: 'Upstream error detected',
                    contentType,
                    preview: probeText.slice(0, 500)
                }), {
                    status: 502,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }
        }

        // Process Playlist
        if (playlistText !== null) {
            const workerOrigin = new URL(request.url).origin;
            const baseProxySuffix = `&referer=${encodeURIComponent(referer)}&cookie=${encodeURIComponent(cookie)}${decryptParam ? `&decrypt=${decryptParam}` : ''}${!proxySegments ? '&proxy_segments=false' : ''}`;

            const resolveUrl = (maybeRelative) => {
                const ref = maybeRelative.trim();
                // Avoid recursive proxying
                if (ref.startsWith(workerOrigin + '/api/hls?') || ref.startsWith('/api/hls?')) return ref;
                if (/^https?:\/\//i.test(ref)) return ref;
                try { return new URL(ref, url).toString(); } catch { return ref; }
            };

            const wrapProxy = (absoluteUrl, kind) => {
                if (absoluteUrl.startsWith(workerOrigin + '/api/hls?') || absoluteUrl.startsWith('/api/hls?')) return absoluteUrl;
                const k = kind ?? (absoluteUrl.toLowerCase().includes('.m3u8') ? 'playlist' : 'seg');
                if (!proxySegments && k === 'seg') return absoluteUrl;
                return `${workerOrigin}/api/hls?url=${encodeURIComponent(absoluteUrl)}&kind=${k}${baseProxySuffix}`;
            };

            // Check if we can enable merging (Only if NO encryption keys and proxy_segments is ON)
            const canMerge = proxySegments && !playlistText.includes('#EXT-X-KEY') && !playlistText.includes('#EXT-X-DISCONTINUITY');
            let rewrittenM3u8 = '';

            if (canMerge) {
                const lines = playlistText.split('\n');
                let newLines = [];
                let buffer = []; // { duration, url }

                const flushBuffer = () => {
                    if (buffer.length === 0) return;
                    if (buffer.length === 1) {
                        newLines.push(`#EXTINF:${buffer[0].duration},`);
                        newLines.push(wrapProxy(buffer[0].url));
                    } else {
                        // Merge 3 segments
                        const totalDur = buffer.reduce((a, b) => a + Number(b.duration), 0);
                        const joinedUrls = buffer.map(b => b.url).join('|');
                        // Fix floating point precision
                        const safeDur = Math.round(totalDur * 100000) / 100000;
                        newLines.push(`#EXTINF:${safeDur},`);
                        newLines.push(`${workerOrigin}/api/hls?concat=${encodeURIComponent(joinedUrls)}${baseProxySuffix}`);
                    }
                    buffer = [];
                };

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (line.startsWith('#EXTINF:')) {
                        const durStr = line.split(':')[1].split(',')[0];
                        const dur = parseFloat(durStr);

                        // Look ahead for URL
                        let j = i + 1;
                        while (j < lines.length && (lines[j].trim() === '' || (lines[j].startsWith('#') && !lines[j].startsWith('#EXT')))) {
                            j++;
                        }

                        if (j < lines.length && !lines[j].startsWith('#')) {
                            // It's a URL
                            const absoluteUrl = resolveUrl(lines[j]);
                            buffer.push({ duration: dur, url: absoluteUrl });
                            i = j; // Advance

                            if (buffer.length >= 10) flushBuffer(); // Batch size 10
                        } else {
                            flushBuffer();
                            newLines.push(line);
                        }
                    } else if (!line.startsWith('#') && line.trim() !== '') {
                        // Orphan URL?
                        flushBuffer();
                        newLines.push(wrapProxy(resolveUrl(line)));
                    } else {
                        // Comments, other tags
                        // Some tags force flush
                        if (line.startsWith('#EXT-X-TARGETDURATION') || line.startsWith('#EXT-X-MEDIA-SEQUENCE')) {
                            flushBuffer();
                        }

                        if (line.startsWith('#')) {
                            // Rewrite URI attributes in tags
                            newLines.push(line.replace(/(URI|KEYFORMATURI)="([^"]+)"/gi, (_match, keyName, uri) => {
                                let absoluteUrl = resolveUrl(uri);
                                return `${keyName}="${wrapProxy(absoluteUrl)}"`;
                            }));
                        } else {
                            newLines.push(line);
                        }
                    }
                }
                flushBuffer();
                rewrittenM3u8 = newLines.join('\n');
            } else {
                // Standard rewrites (Encrypted or No Proxy)
                rewrittenM3u8 = playlistText.split('\n').map(line => {
                    if (line.trim() === '') return line;
                    if (line.startsWith('#')) {
                        return line.replace(/(URI|KEYFORMATURI)="([^"]+)"/gi, (_match, keyName, uri) => {
                            let absoluteUrl = resolveUrl(uri);
                            return `${keyName}="${wrapProxy(absoluteUrl)}"`;
                        });
                    }
                    return wrapProxy(resolveUrl(line.trim()));
                }).join('\n');
            }

            const isVod = rewrittenM3u8.includes('#EXT-X-ENDLIST');
            return new Response(rewrittenM3u8, {
                headers: {
                    'Content-Type': 'application/vnd.apple.mpegurl',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': isVod ? 'public, max-age=14400' : 'no-cache'
                }
            });
        }

        // Proxy Binary/Segment
        const newHeaders = new Headers(response.headers);
        newHeaders.set('Access-Control-Allow-Origin', '*');
        if (rangeHeader) {
            newHeaders.set('Cache-Control', 'no-cache');
        } else {
            newHeaders.set('Cache-Control', 'public, max-age=3600');
        }

        return new Response(response.body, {
            status: response.status,
            headers: newHeaders
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Proxy failed: ' + error.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

async function handleProxyRequest(request, params) {
    const url = params.get('url');
    if (!url) return new Response('Missing url', { status: 400 });

    const referer = params.get('referer');
    const cookie = params.get('cookie');
    const range = request.headers.get('range');

    try {
        const headers = {
            'User-Agent': request.headers.get('user-agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };
        if (referer) headers['Referer'] = referer;
        if (cookie) headers['Cookie'] = cookie;
        if (range) headers['Range'] = range;

        // Forward critical headers for Auth/POST requests
        const allowedHeaders = ['content-type', 'x-requested-with', 'origin', 'accept'];
        for (const h of allowedHeaders) {
            const v = request.headers.get(h);
            if (v) headers[h] = v;
        }

        const response = await fetch(url, { headers });

        const newHeaders = new Headers(response.headers);
        newHeaders.set('Access-Control-Allow-Origin', '*');

        // Ensure connection stays alive for streaming if possible, though Workers handles this
        if (!newHeaders.has('Accept-Ranges')) {
            newHeaders.set('Accept-Ranges', 'bytes');
        }

        return new Response(response.body, {
            status: response.status, // Should be 206 if range was sent and supported
            headers: newHeaders
        });
    } catch (e) {
        return new Response('Error: ' + e.message, { status: 500 });
    }
}

function isProbablySegmentUrl(u) {
    const lower = u.toLowerCase();
    return lower.includes('.ts') || lower.includes('.m4s') || lower.includes('.mp4') || lower.includes('.key');
}
