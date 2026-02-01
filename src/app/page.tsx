'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/Card';
import HeroRotator from '@/components/HeroRotator';
import { fetchHomeClient, fetchDetailsClient } from '@/lib/api-client';
import type { HomePageRow, MovieDetails } from '@/lib/providers/types';

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

type HeroItem = {
  id: string;
  title: string;
  description?: string;
  year?: number;
  score?: number;
  coverImage?: string;
  backgroundImage?: string;
};

export default function Home() {
  const [rows, setRows] = useState<HomePageRow[]>([]);
  const [heroItems, setHeroItems] = useState<HeroItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHome() {
      try {
        const homeRows = await fetchHomeClient();
        setRows(homeRows);

        // Build hero items from fetched content
        const candidateIds = Array.from(
          new Set(
            homeRows
              .flatMap((r) => r?.contents ?? [])
              .map((c) => c?.id)
              .filter((v): v is string => Boolean(v))
          )
        );

        const TARGET_HERO_ITEMS = 10;
        const MAX_CANDIDATE_FETCH = 90;
        const BATCH_SIZE = 30;

        const shuffledIds = [...candidateIds];
        shuffleInPlace(shuffledIds);

        const items: HeroItem[] = [];
        const seenHeroIds = new Set<string>();

        const maxToFetch = Math.min(shuffledIds.length, MAX_CANDIDATE_FETCH);
        for (let start = 0; start < maxToFetch && items.length < TARGET_HERO_ITEMS; start += BATCH_SIZE) {
          const batchIds = shuffledIds.slice(start, start + BATCH_SIZE);
          const batchDetails = await Promise.allSettled(
            batchIds.map((id) => fetchDetailsClient(id, false))
          );

          for (const r of batchDetails) {
            if (r.status !== 'fulfilled') continue;
            const d = r.value;
            if (!d || !d.id) continue;
            if (!d.backgroundImage) continue;
            if (seenHeroIds.has(d.id)) continue;
            seenHeroIds.add(d.id);
            items.push({
              id: d.id,
              title: d.title,
              description: d.description,
              year: d.year,
              score: d.score,
              coverImage: d.coverImage,
              backgroundImage: d.backgroundImage,
            });
            if (items.length >= TARGET_HERO_ITEMS) break;
          }
        }

        setHeroItems(items);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    }

    loadHome();
  }, []);

  if (loading) {
    return (
      <div className="container page-pad">
        <div className="empty-state">
          <h2>Loading...</h2>
          <p>Please wait while we load content.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {heroItems.length > 0 && (
        <section className="hero">
          <HeroRotator items={heroItems} intervalMs={5000} />
        </section>
      )}

      <div className="container page-pad">
        {rows.length === 0 ? (
          <div className="empty-state">
            <h2>No content loaded.</h2>
            <p>Please check your configuration or try again later.</p>
          </div>
        ) : (
          rows.map((row, idx) => (
            row.contents && row.contents.length > 0 && (
              <section key={`${row.name}-${idx}`} className="section">
                <h2 className="section-header">{row.name}</h2>
                <div className="horizontal-scroll">
                  {row.contents.map((content, cIdx) => (
                    <Card
                      key={`${content.id}-${cIdx}`}
                      id={content.id}
                      title={content.title!}
                      image={content.coverImage!}
                    />
                  ))}
                </div>
              </section>
            )
          ))
        )}
      </div>
    </>
  );
}
