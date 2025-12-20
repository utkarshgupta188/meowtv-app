'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SearchBar() {
    const router = useRouter();
    const [query, setQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query)}`);
        }
    };

    return (
        <form className="search-form" onSubmit={handleSearch} role="search">
            <input
                type="text"
                className="search-bar"
                placeholder="Search..."
                aria-label="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
        </form>
    );
}
