'use client';

import { useState, useEffect } from 'react';
import { setProviderAction, getProviderNameAction } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function ProviderSwitcher() {
    const [provider, setProvider] = useState<string>('MeowTV');
    const router = useRouter();

    useEffect(() => {
        getProviderNameAction().then(setProvider);
    }, []);

    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newProvider = e.target.value;
        setProvider(newProvider);
        await setProviderAction(newProvider);

        // If the user switches provider while on a watch page,
        // always exit playback and go back to Home.
        // Use a hard navigation so server components pick up the new cookie immediately.
        if (typeof window !== 'undefined') {
            window.location.assign('/');
            return;
        }

        router.push('/');
    };

    return (
        <select
            suppressHydrationWarning
            value={provider}
            onChange={handleChange}
            className="select"
            aria-label="Provider"
        >
            <option value="MeowTV">MeowTV</option>
            <option value="MeowVerse">MeowVerse</option>
            <option value="MeowToon">MeowToon</option>
        </select>
    );
}
