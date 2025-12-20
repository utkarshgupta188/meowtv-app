import Link from 'next/link';
import React from 'react';

interface CardProps {
    id: string | number;
    title: string;
    image: string;
    type?: number;
}

export default function Card({ id, title, image }: CardProps) {
    // Fallback image if none provided
    const imageUrl = image || 'https://via.placeholder.com/300x450?text=No+Image';
    const safeTitle = title?.trim();

    return (
        <Link
            href={`/watch/${id}`}
            className="card"
            suppressHydrationWarning
            aria-label={safeTitle || 'Open'}
        >
            <img src={imageUrl} alt={title} loading="lazy" />
            {safeTitle ? (
                <div className="card-info">
                    <div className="card-title">{safeTitle}</div>
                </div>
            ) : null}
        </Link>
    );
}
