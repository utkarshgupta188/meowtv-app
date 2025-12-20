'use client';

import { useRouter } from 'next/navigation';

export type SeasonOption = {
    season: number;
    firstEpisodeId?: string;
};

export default function SeasonSwitcher({
    showId,
    options,
    selectedSeason,
    currentEpisodeId,
}: {
    showId: string;
    options: SeasonOption[];
    selectedSeason: number;
    currentEpisodeId?: string;
}) {
    const router = useRouter();

    const selectId = `season-select-${showId}`;

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const season = Number(e.target.value);
        const firstEp = options.find(o => o.season === season)?.firstEpisodeId;
        const ep = firstEp ?? currentEpisodeId;

        const params = new URLSearchParams();
        params.set('season', String(season));
        if (ep) params.set('ep', ep);

        router.push(`/watch/${showId}?${params.toString()}`);
    };

    if (options.length <= 1) return null;

    return (
        <div className="control-row control-row--spaced">
            <label className="control-label" htmlFor={selectId}>
                Season
            </label>
            <select
                id={selectId}
                value={selectedSeason}
                onChange={handleChange}
                className="select"
            >
                {options.map(o => (
                    <option key={o.season} value={o.season}>
                        Season {o.season}
                    </option>
                ))}
            </select>
        </div>
    );
}
