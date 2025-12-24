'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

export type HeroItem = {
  id: string;
  title: string;
  description?: string;
  year?: number;
  score?: number;
  coverImage?: string;
  backgroundImage?: string;
};

function normalizeItems(items: HeroItem[]): HeroItem[] {
  const seen = new Set<string>();
  const out: HeroItem[] = [];
  for (const it of items) {
    const id = String(it?.id ?? '').trim();
    if (!id) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    const title = String(it?.title ?? '').trim();
    const coverImage = String(it?.coverImage ?? '').trim();
    const backgroundImage = String(it?.backgroundImage ?? '').trim();
    out.push({
      id,
      title: title || 'Untitled',
      description: it?.description,
      year: it?.year,
      score: it?.score,
      coverImage: coverImage || undefined,
      backgroundImage: backgroundImage || undefined,
    });
  }
  return out;
}

export default function HeroRotator({
  items,
  initialIndex = 0,
  intervalMs = 5000,
}: {
  items: HeroItem[];
  initialIndex?: number;
  intervalMs?: number;
}) {
  const normalized = useMemo(() => normalizeItems(items), [items]);
  const safeInitial = Math.min(Math.max(initialIndex, 0), Math.max(normalized.length - 1, 0));

  const [index, setIndex] = useState<number>(safeInitial);
  const lastUserActionAt = useRef<number>(0);

  useEffect(() => {
    setIndex(safeInitial);
  }, [safeInitial]);

  const current = normalized[index] ?? normalized[0] ?? null;

  const pickRandomIndex = (maxExclusive: number, exclude: number) => {
    if (maxExclusive <= 1) return 0;
    // Try a few times to avoid repeats.
    for (let i = 0; i < 8; i++) {
      const next = Math.floor(Math.random() * maxExclusive);
      if (next !== exclude) return next;
    }
    return (exclude + 1) % maxExclusive;
  };

  useEffect(() => {
    if (normalized.length <= 1) return;

    const t = window.setInterval(() => {
      // If the user recently touched the slider, don't fight them.
      if (Date.now() - lastUserActionAt.current < 2500) return;
      setIndex((prev) => pickRandomIndex(normalized.length, prev));
    }, intervalMs);

    return () => window.clearInterval(t);
  }, [normalized.length, intervalMs]);

  if (!current) return null;

  const backdrop = current.backgroundImage || current.coverImage || '';

  return (
    <>
      <div className="hero-backdrop" style={{ backgroundImage: `url(${backdrop})` }} />
      <div className="hero-overlay" />

      <div className="container hero-content">
        <h1 className="hero-title">{current.title}</h1>
        <div className="hero-meta">
          {current.year ? <span>{current.year}</span> : null}
          {typeof current.score === 'number' ? (
            <span>{current.year ? ' • ' : ''}{current.score}</span>
          ) : null}
        </div>
        {current.description ? (
          <p className="hero-description">{current.description}</p>
        ) : null}
        <div className="hero-actions">
          <Link href={`/watch/${encodeURIComponent(String(current.id))}`} className="btn btn-primary">
            Play
          </Link>
          <Link href={`/watch/${encodeURIComponent(String(current.id))}`} className="btn btn-secondary">
            More Info
          </Link>
        </div>
      </div>

      {normalized.length > 1 ? (
        <div className="hero-dots" aria-label="Hero selector">
          <div className="hero-dots-inner" role="tablist" aria-label="Hero items">
            {normalized.slice(0, 12).map((it, i) => (
              <button
                key={it.id}
                type="button"
                className={`hero-dot ${i === index ? 'is-active' : ''}`}
                onClick={() => {
                  lastUserActionAt.current = Date.now();
                  setIndex(i);
                }}
                aria-label={it.title}
                aria-current={i === index}
              />
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
