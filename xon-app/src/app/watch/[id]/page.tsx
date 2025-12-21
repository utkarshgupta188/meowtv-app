import Link from 'next/link';

import VideoPlayer from '@/components/VideoPlayer';
import { fetchMergedDetails, fetchMergedStream } from '@/lib/merged';

export const dynamic = 'force-dynamic';

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ep?: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  const { ep } = await searchParams;
  const decodedEp = ep ? decodeURIComponent(ep) : undefined;

  const details = await fetchMergedDetails(decodedId);
  if (!details) {
    return (
      <div className="container">
        <p>Not found.</p>
      </div>
    );
  }

  const episodes = details.episodes ?? [];
  const currentEpisode = details.type === 'series'
    ? (decodedEp ? episodes.find((x) => x.id === decodedEp) : null) ?? episodes[0] ?? null
    : null;

  // Decide what to play:
  // - movie/episode: play itself
  // - series: play selected episode (query param) or first
  const targetStreamId = (() => {
    // Kartoons movies are represented as a single "episode" entry in details.episodes.
    if (details.id.startsWith('kartoons:') && details.type === 'movie') {
      return details.episodes?.[0]?.id ?? null;
    }

    if (details.type === 'movie' || details.type === 'episode') return details.id;
    const selected = decodedEp ? episodes.find((x) => x.id === decodedEp) : null;
    return (selected ?? episodes[0])?.id ?? null;
  })();

  const stream = targetStreamId ? await fetchMergedStream(targetStreamId) : null;

  const showEpisodeUi = details.type === 'series' && (details.episodes?.length ?? 0) > 1;

  const sourceLabel = details.id.startsWith('kartoons:') ? 'Kartoons' : 'Xon';

  return (
    <div className="container">
      {stream?.qualities?.length ? (
        <VideoPlayer title={stream.title} qualities={stream.qualities} />
      ) : (
        <div className="player-container player-shell player-empty center">
          <p className="muted">No stream available or error fetching stream.</p>
        </div>
      )}

      <div className="details-container">
        <h1 className="details-title">{details.title}</h1>
        <div className="details-meta">
          {sourceLabel} • {details.type}
          {currentEpisode ? <span> • {currentEpisode.title}</span> : null}
        </div>

        {details.description ? <p>{details.description}</p> : null}

        {showEpisodeUi && episodes.length > 0 ? (
          <div className="episode-list">
            <div>
              <h3 className="subsection-header">Episodes</h3>
              <div className="episode-grid">
                {episodes.map((e) => {
                  const active = currentEpisode?.id === e.id;
                  const episodeLabel =
                    typeof e.season === 'number' && typeof e.episode === 'number'
                      ? `S${e.season} • Ep ${e.episode}`
                      : typeof e.episode === 'number'
                        ? `Ep ${e.episode}`
                        : 'Episode';

                  return (
                    <Link
                      key={e.id}
                      href={`/watch/${encodeURIComponent(details.id)}?ep=${encodeURIComponent(e.id)}`}
                      className={`episode-item${active ? ' active' : ''}`}
                    >
                      <div className="episode-number">{episodeLabel}</div>
                      <div className="episode-title">{e.title}</div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
