'use client';

import { useState, useEffect } from 'react';
import { setProviderAction, getProviderNameAction } from '@/lib/api';

export default function ProviderSwitcher() {
    const [provider, setProvider] = useState<string>('MeowTV');

    useEffect(() => {
        getProviderNameAction().then(setProvider);
    }, []);

    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newProvider = e.target.value;
        setProvider(newProvider);
        await setProviderAction(newProvider);

        // Hard navigation so server components pick up the new cookie immediately.
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
