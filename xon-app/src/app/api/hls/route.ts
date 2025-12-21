import { NextRequest, NextResponse } from 'next/server';

import { decryptInline } from '@/lib/enc2';

function looksLikePlaylistText(text: string): boolean {
  return /^#EXTM3U\b/m.test(text);
}

function isProbablySegmentUrl(u: string): boolean {
  const lower = u.toLowerCase();
  return (
    lower.includes('.ts') ||
    lower.includes('.m4s') ||
    lower.includes('.mp4') ||
    lower.includes('.mkv') ||
    lower.includes('.aac') ||
    lower.includes('.mp3') ||
    lower.includes('.key') ||
    lower.includes('/segment/')
  );
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const referer = request.nextUrl.searchParams.get('referer') || '';
  const cookie = request.nextUrl.searchParams.get('cookie') || 'hd=on';
  const decryptParam = request.nextUrl.searchParams.get('decrypt') || '';
  const kindParam = (request.nextUrl.searchParams.get('kind') || '').toLowerCase();
  const rangeHeader = request.headers.get('range');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const headers: HeadersInit = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };
    if (referer) (headers as any).Referer = referer;
    if (cookie) (headers as any).Cookie = cookie;
    if (rangeHeader) (headers as any).Range = rangeHeader;

    let upstream: Response;
    try {
      upstream = await fetch(url, { headers, signal: request.signal });
    } catch (e: any) {
      const name = String(e?.name ?? '');
      const msg = String(e?.message ?? e ?? '');
      const isAbort = name === 'AbortError' || /aborted/i.test(msg);
      if (!isAbort) console.error('[hls] error', e);
      return NextResponse.json({ error: 'HLS aborted' }, { status: 499 });
    }

    if (!upstream.ok) {
      return NextResponse.json({ error: 'Upstream fetch failed' }, { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || '';
    const contentLength = Number(upstream.headers.get('content-length') || '0') || 0;

    const forceSeg = kindParam === 'seg';
    const forcePlaylistRequested = kindParam === 'playlist';
    const looksLikePlaylistByUrl = url.toLowerCase().includes('.m3u8');
    const looksLikePlaylistByType = /mpegurl|m3u8/i.test(contentType);

    const isClearlyBinary =
      /^video\//i.test(contentType) ||
      // If upstream says it's generic binary AND it's large, don't try to parse it as text.
      (/application\/octet-stream/i.test(contentType) && contentLength > 2_000_000);

    const forcePlaylist = forcePlaylistRequested && !forceSeg && !isClearlyBinary;

    const canSniffText =
      !forceSeg &&
      !isProbablySegmentUrl(url) &&
      (contentLength === 0 || contentLength <= 2_000_000) &&
      !/application\/octet-stream/i.test(contentType);

    let playlistText: string | null = null;
    if (forcePlaylist || looksLikePlaylistByUrl || looksLikePlaylistByType) {
      playlistText = await upstream.text();
    } else if (canSniffText) {
      const probeText = await upstream.clone().text().catch(() => null);
      if (probeText && looksLikePlaylistText(probeText)) playlistText = probeText;
    }

    if (playlistText !== null) {
      const baseProxySuffix = `${referer ? `&referer=${encodeURIComponent(referer)}` : ''}${cookie ? `&cookie=${encodeURIComponent(cookie)}` : ''}${decryptParam ? `&decrypt=${encodeURIComponent(decryptParam)}` : ''}`;

      const resolveUrl = (maybeRelative: string) => {
        const ref = maybeRelative.trim();
        if (ref.startsWith('/api/hls?') || ref.startsWith('/api/proxy?')) return ref;
        if (/^https?:\/\//i.test(ref)) return ref;
        try {
          return new URL(ref, url).toString();
        } catch {
          return ref;
        }
      };

      const decryptIfNeeded = (value: string) => decryptInline(value);

      const inferKind = (absoluteUrl: string): 'playlist' | 'seg' => {
        const lower = absoluteUrl.toLowerCase();
        if (lower.includes('.m3u8') || /mpegurl|m3u8/i.test(lower)) return 'playlist';
        return 'seg';
      };

      const wrapProxy = (absoluteUrl: string, kind?: 'playlist' | 'seg') => {
        if (absoluteUrl.startsWith('/api/hls?') || absoluteUrl.startsWith('/api/proxy?')) return absoluteUrl;
        const k = kind ?? inferKind(absoluteUrl);
        return `/api/hls?url=${encodeURIComponent(absoluteUrl)}&kind=${k}${baseProxySuffix}`;
      };

      const rewriteUriAttributes = (line: string) => {
        let out = decryptIfNeeded(line);

        // Quoted form: URI="..." and KEYFORMATURI="..."
        out = out.replace(/(URI|KEYFORMATURI)="([^"]+)"/gi, (_match, keyName: string, uri: string) => {
          if (uri.startsWith('/api/hls?')) return `${keyName}="${uri}"`;
          let absoluteUrl = decryptIfNeeded(uri);
          absoluteUrl = resolveUrl(absoluteUrl);
          return `${keyName}="${wrapProxy(absoluteUrl)}"`;
        });

        // Unquoted form: URI=foo.m3u8 or URI=enc2:...
        out = out.replace(/(URI|KEYFORMATURI)=([^,\s]+)/gi, (_match, keyName: string, uri: string) => {
          if (uri.startsWith('"') || uri.startsWith('/api/hls?')) return `${keyName}=${uri}`;
          let absoluteUrl = decryptIfNeeded(uri);
          absoluteUrl = resolveUrl(absoluteUrl);
          return `${keyName}=${wrapProxy(absoluteUrl)}`;
        });

        return out;
      };

      const rewritten = playlistText
        .split('\n')
        .map((line) => {
          if (line.trim() === '') return line;
          if (line.startsWith('#')) return rewriteUriAttributes(line);

          const trimmed = line.trim();
          if (trimmed.startsWith('/api/hls?') || trimmed.startsWith('/api/proxy?')) return trimmed;

          let absoluteUrl = decryptIfNeeded(trimmed);
          absoluteUrl = resolveUrl(absoluteUrl);
          return wrapProxy(absoluteUrl);
        })
        .join('\n');

      return new NextResponse(rewritten, {
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      });
    }

    if (!upstream.body) {
      return NextResponse.json({ error: 'No upstream body' }, { status: 500 });
    }

    const outHeaders: Record<string, string> = {
      'Content-Type': contentType || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': rangeHeader ? 'no-cache' : 'public, max-age=3600',
    };

    const contentRange = upstream.headers.get('content-range');
    if (contentRange) outHeaders['Content-Range'] = contentRange;

    const acceptRanges = upstream.headers.get('accept-ranges');
    if (acceptRanges) outHeaders['Accept-Ranges'] = acceptRanges;

    const upstreamLength = upstream.headers.get('content-length');
    if (upstreamLength) outHeaders['Content-Length'] = upstreamLength;

    return new NextResponse(upstream.body, { status: upstream.status, headers: outHeaders });
  } catch (e) {
    console.error('[hls] error', e);
    return NextResponse.json({ error: 'HLS proxy failed' }, { status: 500 });
  }
}
