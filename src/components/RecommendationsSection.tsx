'use client';

import Card from './Card';
import { RelatedItem } from '@/lib/providers/types';

interface RecommendationsSectionProps {
    items: RelatedItem[];
}

export default function RecommendationsSection({ items }: RecommendationsSectionProps) {
    if (!items || items.length === 0) return null;

    return (
        <section className="section recommendations-section">
            <h2 className="section-header">Recommended</h2>
            <div className="horizontal-scroll">
                {items.map((item, idx) => (
                    <Card
                        key={`rec-${item.id}-${idx}`}
                        id={item.id}
                        title={item.title}
                        image={item.image}
                    />
                ))}

            </div>
        </section>
    );
}
