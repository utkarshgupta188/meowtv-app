import Link from 'next/link';
import React from 'react';

export default function Card({
  id,
  title,
  image,
}: {
  id: string;
  title: string;
  image?: string;
}) {
  const imageUrl = image || 'https://via.placeholder.com/300x450?text=No+Image';
  const safeTitle = title?.trim();

  return (
    <Link
      href={`/watch/${encodeURIComponent(id)}`}
      className="card"
      suppressHydrationWarning
      aria-label={safeTitle || 'Open'}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt={title} loading="lazy" />
      {safeTitle ? (
        <div className="card-info">
          <div className="card-title">{safeTitle}</div>
        </div>
      ) : null}
    </Link>
  );
}
