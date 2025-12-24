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
            <div className="search-shell">
                <span className="search-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.5 15.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2" />
                    </svg>
                </span>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search for a title"
                    aria-label="Search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <button type="submit" className="search-button" aria-label="Search">
                    Go
                </button>
            </div>
        </form>
    );
}
