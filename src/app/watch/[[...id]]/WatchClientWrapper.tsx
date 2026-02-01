'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import WatchClientComponent from '@/components/WatchClient';
import SeasonSwitcher from '@/components/SeasonSwitcher';
import RecommendationsSection from '@/components/RecommendationsSection';
import type { MovieDetails as ContentDetails } from '@/lib/providers/types';
import { fetchDetailsClient } from '@/lib/api-client';

// Note: fetchStreamClient is now handled by WatchClient component directly

function getProviderFromCookieSync(): string {
    if (typeof window === 'undefined') return 'MeowTV';

    // Check localStorage first (set by api-client)
    const stored = localStorage.getItem('meowtv_provider');
    if (stored) {
        return stored;
    }

    // Fallback to cookie
    const match = document.cookie.match(/provider=([^;]+)/);
    return match ? match[1] : 'MeowTV';
}

function WatchPageContent() {
    const params = useParams();
    const searchParams = useSearchParams();

    // For Tauri static builds, read ID from hash since URL params don't work
    const [id, setId] = useState('');

    useEffect(() => {
        // Try to get ID from URL params first (works in dev)
        const idSegments = params.id as string[] | undefined;
        let watchId = idSegments ? idSegments.map(s => decodeURIComponent(s)).join('/') : '';
        
        // Fallback: Check if running in static export (no dynamic params)
        // Look for ID in hash or query params
        if (!watchId && typeof window !== 'undefined') {
            // Check hash routing: #/watch/123
            const hash = window.location.hash;
            if (hash && hash.includes('/watch/')) {
                const hashId = hash.split('/watch/')[1]?.split('?')[0];
                if (hashId) watchId = decodeURIComponent(hashId);
            }
            
            // Also check search params as fallback
            const urlId = searchParams.get('id');
            if (!watchId && urlId) {
                watchId = decodeURIComponent(urlId);
            }
        }
        
        setId(watchId);
    }, [params.id, searchParams]);

    const [details, setDetails] = useState<ContentDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [providerName, setProviderName] = useState<string>('MeowTV');
    // videoData state removed - stream fetching handled by WatchClient

    // Read provider from cookie on client mount
    useEffect(() => {
        const provider = getProviderFromCookieSync();

        setProviderName(provider);
    }, []);

    const showOpenDownload = providerName !== 'MeowVerse';

    // Fetch details when ID changes
    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        fetchDetailsClient(id).then(data => {
            if (data) {
                setDetails(data);
            } else {
                setError('Failed to load content details');
            }
            setLoading(false);
        }).catch(err => {

            setError('Failed to load content details');
            setLoading(false);
        });
    }, [id]);

    // Parse search params
    const epParam = searchParams.get('ep');
    const seasonParam = searchParams.get('season');
    const decodedEp = epParam ? decodeURIComponent(epParam) : undefined;

    // Group episodes by season
    const episodesBySeason: { [key: number]: NonNullable<typeof details>['episodes'] } = {};
    if (details?.episodes) {
        details.episodes.forEach(epItem => {
            const s = epItem.season || 1;
            if (!episodesBySeason[s]) episodesBySeason[s] = [];
            episodesBySeason[s]?.push(epItem);
        });
    }
    Object.keys(episodesBySeason).forEach(k => {
        const num = Number(k);
        episodesBySeason[num]?.sort((a, b) => (a.number - b.number));
    });

    const seasonNumbers = Object.keys(episodesBySeason)
        .map(Number)
        .filter(n => Number.isFinite(n))
        .sort((a, b) => a - b);

    const totalEpisodes = details?.episodes?.length ?? 0;
    const showEpisodeUi = seasonNumbers.length > 1 || totalEpisodes > 1;

    const requestedSeason = seasonParam ? Number.parseInt(seasonParam, 10) : undefined;
    const safeSeason =
        requestedSeason && seasonNumbers.includes(requestedSeason)
            ? requestedSeason
            : undefined;

    const epFromParam = details?.episodes?.find(e => e.id === decodedEp);
    const epFromRequestedSeason = safeSeason ? episodesBySeason[safeSeason]?.[0] : undefined;

    const currentEpisode = safeSeason
        ? (epFromParam && (epFromParam.season || 1) === safeSeason ? epFromParam : epFromRequestedSeason)
        : (epFromParam || details?.episodes?.[0]);


    const selectedSeason = safeSeason ?? (currentEpisode?.season || seasonNumbers[0] || 1);

    // Calculate languageId
    let languageId: number | undefined;
    if (currentEpisode?.tracks && currentEpisode.tracks.length > 0) {
        const tracksAny = currentEpisode.tracks as any[];
        const hasIndividualVideo = tracksAny.some(t => t?.existIndividualVideo === true);
        if (hasIndividualVideo) {
            const defaultTrack = tracksAny.find(t => t?.isDefault) || tracksAny[0];
            languageId = defaultTrack?.languageId;
        }
    }

    // Note: Stream fetching is now handled entirely by WatchClient component
    // We only pass episode metadata here, WatchClient fetches the actual stream

    // Transform episode tracks to audioTracks format for WatchClient
    const audioTracks = currentEpisode?.tracks?.map((t: any) => ({
        languageId: t.languageId ?? '',
        name: t.name
    })) || [];

    if (!id) {
        return (
            <div className="container page-pad">
                <div className="player-container player-shell player-empty center">
                    <p className="muted">No content selected.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container page-pad">
                <div className="player-container player-shell player-empty center">
                    <p className="muted">Loading...</p>
                </div>
            </div>
        );
    }

    if (error || !details) {
        return <div className="container page-pad">Error loading content.</div>;
    }

    return (
        <div className="container page-pad">
            <div style={{ minHeight: '60vh' }}>
                {currentEpisode ? (
                    <WatchClientComponent
                        initialVideoData={null}
                        providerName={providerName || 'MeowTV'}
                        movieId={currentEpisode.sourceMovieId || details.id}
                        episodeId={currentEpisode.id}
                        languageId={languageId}
                        poster={currentEpisode?.coverImage || details.coverImage || details.backgroundImage}
                        audioTracks={audioTracks}
                        showOpenDownload={showOpenDownload}
                    />
                ) : (
                    <div className="player-container player-shell player-empty center">
                        <p className="muted">No episode selected.</p>
                    </div>
                )}
            </div>

            <div className="details-container">
                <h1 className="details-title">{details.title}</h1>
                <div className="details-meta">
                    {details.year} • {details.score}
                    {showEpisodeUi && currentEpisode && (
                        <span> • {currentEpisode.title || `Episode ${currentEpisode.number}`}</span>
                    )}
                </div>
                <p>{details.description}</p>

                {showEpisodeUi && seasonNumbers.length > 0 && (
                    <SeasonSwitcher
                        showId={id}
                        selectedSeason={selectedSeason}
                        currentEpisodeId={currentEpisode?.id}
                        options={seasonNumbers.map(s => ({
                            season: s,
                            firstEpisodeId: episodesBySeason[s]?.[0]?.id
                        }))}
                    />
                )}

                {showEpisodeUi && Object.keys(episodesBySeason).length > 0 && (
                    <div className="episode-list">
                        <div>
                            <h3 className="subsection-header">
                                Season {selectedSeason}
                            </h3>
                            <div className="episode-grid">
                                {episodesBySeason[selectedSeason]?.map(epItem => (
                                    <a
                                        key={epItem.id}
                                        href={`/watch/${encodeURIComponent(id)}?season=${selectedSeason}&ep=${encodeURIComponent(epItem.id)}`}
                                        className={`episode-item ${epItem.id === currentEpisode?.id ? 'active' : ''}`}
                                    >
                                        <div className="episode-number">Ep {epItem.number}</div>
                                        <div className="episode-title">{epItem.title}</div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Recommendations Section */}
            {details.relatedContent && details.relatedContent.length > 0 && (
                <RecommendationsSection items={details.relatedContent} />
            )}
        </div>
    );
}

export default function WatchClientWrapper() {
    return (
        <Suspense fallback={
            <div className="container page-pad">
                <div className="player-container player-shell player-empty center">
                    <p className="muted">Loading...</p>
                </div>
            </div>
        }>
            <WatchPageContent />
        </Suspense>
    );
}
