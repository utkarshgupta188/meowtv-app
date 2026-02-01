'use client';

import { useState, useEffect } from 'react';
import { getProviderFromCookie, setProviderCookie } from '@/lib/api-client';

export default function ProviderSwitcher() {
    const [provider, setProvider] = useState<string>('MeowTV');

    useEffect(() => {
        setProvider(getProviderFromCookie());
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newProvider = e.target.value;
        setProvider(newProvider);
        setProviderCookie(newProvider);

        // Hard navigation so components pick up the new cookie immediately.
        window.location.assign('/');
    };

    return (
        <select
            value={provider}
            onChange={handleChange}
            className="select select--nav"
            aria-label="Provider"
        >
            <option value="MeowTV">MeowTV</option>
            <option value="MeowVerse">MeowVerse</option>
            <option value="MeowToon">MeowToon</option>
        </select>
    );
}
