'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Hls from 'hls.js';

import type { StreamQuality } from '@/lib/types';

export default function VideoPlayer({
  title,
  qualities,
}: {
  title: string;
  qualities: StreamQuality[];
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const defaultUrl = qualities[0]?.url || '';
  const [selectedUrl, setSelectedUrl] = useState(defaultUrl);

  const decodedUpstreamUrl = useMemo(() => {
    try {
      const parsed = new URL(selectedUrl, window.location.origin);
      const u = parsed.searchParams.get('url');
      return u ? decodeURIComponent(u) : '';
    } catch {
      return '';
    }
  }, [selectedUrl]);

  const isHls = useMemo(() => {
    if (/\/api\/hls\?/.test(selectedUrl)) return true;
    if (/\.m3u8(\?|$)/i.test(selectedUrl)) return true;
    if (decodedUpstreamUrl && /\.m3u8(\?|$)/i.test(decodedUpstreamUrl)) return true;
    if (decodedUpstreamUrl && /m3u8/i.test(decodedUpstreamUrl)) return true;
    return false;
  }, [selectedUrl, decodedUpstreamUrl]);

  const isMkv = useMemo(() => {
    if (/\.mkv(\?|$)/i.test(selectedUrl)) return true;
    if (decodedUpstreamUrl && /\.mkv(\?|$)/i.test(decodedUpstreamUrl)) return true;
    return false;
  }, [selectedUrl, decodedUpstreamUrl]);

  useEffect(() => {
    setSelectedUrl(defaultUrl);
  }, [defaultUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Clean up previous Hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (!selectedUrl) return;

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });
      hlsRef.current = hls;
      hls.loadSource(selectedUrl);
      hls.attachMedia(video);
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    // Native playback (MP4, etc)
    video.src = selectedUrl;
    return;
  }, [selectedUrl, isHls]);

  const selectId = `quality-select-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div>
      <div className="control-row control-row--spaced">
        <div className="control-label">{title}</div>
        {qualities.length > 1 ? (
          <>
            <label className="control-label" htmlFor={selectId}>
              Quality
            </label>
            <select
              id={selectId}
              value={selectedUrl}
              onChange={(e) => setSelectedUrl(e.target.value)}
              className="select"
              aria-label="Quality"
            >
              {qualities.map((q) => (
                <option key={`${q.label}-${q.url}`} value={q.url}>
                  {q.label}
                </option>
              ))}
            </select>
          </>
        ) : null}

        {selectedUrl ? (
          <a href={selectedUrl} target="_blank" rel="noopener noreferrer" className="player-action">
            Open / Download
          </a>
        ) : null}
      </div>

      <div className="player-container player-shell">
        <video ref={videoRef} className="player-video" controls playsInline />

        {isMkv ? (
          <div className="player-center-badge">
            <p className="title">MKV file</p>
            <p className="hint">MKV may not play in-browser. Use Open / Download.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
