'use client';

import { useState, useEffect } from 'react';
import VideoPlayer, { VideoPlayerProps } from '@/components/VideoPlayer';
import { fetchStreamClient } from '@/lib/api-client';

interface WatchClientProps extends Omit<VideoPlayerProps, 'initialUrl' | 'movieId' | 'episodeId'> {
    initialVideoData: {
        videoUrl: string;
        subtitles?: any[];
        qualities?: any[];
        audioTracks?: any[];
    } | null;
    providerName: string;
    movieId: string;
    episodeId: string;
    languageId?: number | string;
    poster?: string;
}

export default function WatchClient({
    initialVideoData,
    providerName,
    movieId,
    episodeId,
    languageId,
    poster,
    ...props
}: WatchClientProps) {
    const [videoData, setVideoData] = useState(initialVideoData);
    const [loading, setLoading] = useState(!initialVideoData);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // If we already have data (e.g. passed from SSR or previous load), use it
        if (initialVideoData) {
            setLoading(false);
            return;
        }

        // For standalone builds, fetch stream client-side for ALL providers
        setLoading(true);
        setError(null);

        fetchStreamClient(movieId, episodeId, languageId)
            .then(data => {
                if (data && data.videoUrl) {
                    setVideoData({
                        videoUrl: data.videoUrl,
                        subtitles: data.subtitles?.map((s: any) => ({
                            title: s.label || s.title || s.language || 'Subtitles',
                            url: s.url,
                            language: s.language || 'en'
                        })) || [],
                        qualities: data.qualities || [],
                        audioTracks: []
                    });
                } else {
                    setError('Failed to load stream.');
                }
            })
            .catch(err => {
                setError('Error loading stream.');
            })
            .finally(() => setLoading(false));
    }, [providerName, movieId, episodeId, languageId, initialVideoData]);

    if (loading) {
        return (
            <div className="player-container player-shell player-loading center">
                <div className="spinner"></div>
                <p className="muted" style={{ marginTop: '1rem' }}>Initiating Secure Session...</p>
            </div>
        );
    }

    if (error || !videoData?.videoUrl) {
        return (
            <div className="player-container player-shell player-empty center">
                <p className="muted">{error || 'No stream available.'}</p>
            </div>
        );
    }

    return (
        <VideoPlayer
            key={episodeId}
            initialUrl={videoData.videoUrl}
            poster={poster}
            movieId={movieId}
            episodeId={episodeId}
            languageId={languageId}
            subtitles={videoData.subtitles || []}
            qualities={videoData.qualities || []}
            audioTracks={props.audioTracks} // Passed from page.tsx (episode tracks)
            showOpenDownload={props.showOpenDownload}
        />
    );
}
