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
        router.refresh();
        window.location.reload(); // Force reload to ensure all data is re-fetched
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
