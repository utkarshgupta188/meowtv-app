import Link from 'next/link';

interface CardProps {
    id: string | number;
    title: string;
    image: string;
}

export default function Card({ id, title, image }: CardProps) {
    // Fallback image if none provided
    const imageUrl = image || 'https://via.placeholder.com/300x450?text=No+Image';
    const safeTitle = title?.trim();

    return (
        <Link
            href={`/watch/${encodeURIComponent(String(id))}`}
            className="card"
            aria-label={safeTitle || 'Open'}
        >
            <img src={imageUrl} alt={title} loading="lazy" />
            <div className="card-overlay" aria-hidden="true">
                <span className="card-chip">Play</span>
            </div>
            {safeTitle ? (
                <div className="card-info">
                    <div className="card-title">{safeTitle}</div>
                </div>
            ) : null}
        </Link>
    );
}
