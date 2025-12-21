import { NextRequest, NextResponse } from 'next/server';

function buildUpstreamHeaders(request: NextRequest, referer: string | null): HeadersInit {
  const headers: HeadersInit = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  const range = request.headers.get('range');
  if (range) (headers as any).Range = range;

  const accept = request.headers.get('accept');
  if (accept) (headers as any).Accept = accept;

  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) (headers as any)['Accept-Language'] = acceptLanguage;

  if (referer) (headers as any).Referer = referer;

  return headers;
}

function isAbortError(e: any): boolean {
  const name = String(e?.name ?? '');
  const msg = String(e?.message ?? e ?? '');
  return (
    name === 'AbortError' ||
    name === 'ResponseAborted' ||
    /aborted/i.test(msg) ||
    /responseaborted/i.test(msg)
  );
}

function buildOutgoingHeaders(upstream: Response, hadRange: boolean): Headers {
  const outHeaders = new Headers();
  outHeaders.set('Access-Control-Allow-Origin', '*');

  const contentType = upstream.headers.get('content-type');
  if (contentType) outHeaders.set('Content-Type', contentType);

  // Forward streaming-related headers.
  const contentLength = upstream.headers.get('content-length');
  if (contentLength) outHeaders.set('Content-Length', contentLength);

  const contentRange = upstream.headers.get('content-range');
  if (contentRange) outHeaders.set('Content-Range', contentRange);

  const acceptRanges = upstream.headers.get('accept-ranges');
  if (acceptRanges) outHeaders.set('Accept-Ranges', acceptRanges);

  const contentDisposition = upstream.headers.get('content-disposition');
  if (contentDisposition) outHeaders.set('Content-Disposition', contentDisposition);

  outHeaders.set('Cache-Control', hadRange ? 'no-cache' : 'public, max-age=3600');
  outHeaders.set('Vary', 'Range');
  return outHeaders;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const referer = request.nextUrl.searchParams.get('referer');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const hadRange = Boolean(request.headers.get('range'));
    const headers = buildUpstreamHeaders(request, referer);

    let upstream: Response;
    try {
      upstream = await fetch(url, { headers, signal: request.signal });
    } catch (e: any) {
      // Browsers often abort range requests during seeking; don't spam logs.
      if (!isAbortError(e)) console.error('[proxy] error', e);
      return NextResponse.json({ error: 'Proxy aborted' }, { status: 499 });
    }

    if (!upstream.ok) {
      return NextResponse.json({ error: 'Upstream fetch failed' }, { status: upstream.status });
    }

    if (!upstream.body) {
      return NextResponse.json({ error: 'No upstream body' }, { status: 500 });
    }

    const outHeaders = buildOutgoingHeaders(upstream, hadRange);

    return new NextResponse(upstream.body as any, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: outHeaders,
    });
  } catch (e) {
    console.error('[proxy] error', e);
    return NextResponse.json({ error: 'Proxy failed' }, { status: 500 });
  }
}

export async function HEAD(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const referer = request.nextUrl.searchParams.get('referer');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const hadRange = Boolean(request.headers.get('range'));
    const headers = buildUpstreamHeaders(request, referer);

    let upstream: Response;
    try {
      upstream = await fetch(url, { method: 'HEAD', headers, signal: request.signal });
    } catch (e: any) {
      if (!isAbortError(e)) console.error('[proxy] head error', e);
      return NextResponse.json({ error: 'Proxy aborted' }, { status: 499 });
    }

    const outHeaders = buildOutgoingHeaders(upstream, hadRange);
    return new NextResponse(null, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: outHeaders,
    });
  } catch (e) {
    console.error('[proxy] head error', e);
    return NextResponse.json({ error: 'Proxy failed' }, { status: 500 });
  }
}
