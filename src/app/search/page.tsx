'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Card from '@/components/Card';
import { searchContentClient } from '@/lib/api-client';
import type { ContentItem } from '@/lib/providers/types';

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const [results, setResults] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }

        setLoading(true);
        searchContentClient(query)
            .then(data => {
                setResults(data);
            })
            .catch(error => {
                setResults([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [query]);

    return (
        <div className="container page-pad">
            <h2 className="section-header">
                {query ? `Results for "${query}"` : 'Search'}
            </h2>

            {!query && <p>Type something in the search bar to start.</p>}

            {loading && <p>Searching...</p>}

            {query && !loading && results.length === 0 && <p>No results found.</p>}

            <div className="grid">
                {results.map((item) => (
                    <Card
                        key={item.id}
                        id={item.id}
                        title={item.title!}
                        image={item.coverImage!}
                    />
                ))}
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="container page-pad">Loading search...</div>}>
            <SearchContent />
        </Suspense>
    );
}
