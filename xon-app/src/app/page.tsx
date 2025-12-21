import Link from 'next/link';

import Card from '@/components/Card';
import { fetchMergedDetails, fetchMergedHome } from '@/lib/merged';

export const revalidate = 60;
export const dynamic = 'force-dynamic';

export default async function Home() {
  const rows = await fetchMergedHome();

  const featuredId = rows?.[0]?.items?.[0]?.id;
  const featured = featuredId ? await fetchMergedDetails(featuredId) : null;

  return (
    <>
      {featured ? (
        <section className="hero">
          <div
            className="hero-backdrop"
            style={{
              backgroundImage: `url(${featured.backdrop || featured.poster || ''})`,
            }}
          />
          <div className="hero-overlay" />
          <div className="container hero-content">
            <h1 className="hero-title">{featured.title}</h1>
            {featured.description ? (
              <p className="hero-description">{featured.description}</p>
            ) : null}
            <div className="hero-actions">
              <Link href={`/watch/${encodeURIComponent(featured.id)}`} className="btn btn-primary">
                Play
              </Link>
              <Link href={`/watch/${encodeURIComponent(featured.id)}`} className="btn btn-secondary">
                More Info
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <div className="container">
        {rows.length === 0 ? (
          <div className="empty-state">
            <h2>No content loaded.</h2>
            <p>Please try again later.</p>
          </div>
        ) : (
          rows.map((row, idx) =>
            row.items && row.items.length > 0 ? (
              <section key={`${row.name}-${idx}`} className="section">
                <h2 className="section-header">{row.name}</h2>
                <div className="horizontal-scroll">
                  {row.items.map((item) => (
                    <Card
                      key={item.id}
                      id={item.id}
                      title={item.title || item.id}
                      image={item.poster}
                    />
                  ))}
                </div>
              </section>
            ) : null
          )
        )}
      </div>
    </>
  );
}
