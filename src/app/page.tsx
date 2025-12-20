import { fetchHome } from '@/lib/api';
import { fetchDetails } from '@/lib/api';
import Card from '@/components/Card';
import Link from 'next/link';

export const revalidate = 60; // Revalidate every minute

export default async function Home() {
  const rows = await fetchHome();

  const featuredId = rows?.[0]?.contents?.[0]?.id;
  const featured = featuredId ? await fetchDetails(featuredId) : null;

  return (
    <>
      {featured ? (
        <section className="hero">
          <div
            className="hero-backdrop"
            style={{
              backgroundImage: `url(${featured.backgroundImage || featured.coverImage})`,
            }}
          />
          <div className="hero-overlay" />
          <div className="container hero-content">
            <h1 className="hero-title">{featured.title}</h1>
            <div className="hero-meta">
              {featured.year ? <span>{featured.year}</span> : null}
              {featured.score ? (
                <span>{featured.year ? ' • ' : ''}{featured.score}</span>
              ) : null}
            </div>
            {featured.description ? (
              <p className="hero-description">{featured.description}</p>
            ) : null}
            <div className="hero-actions">
              <Link href={`/watch/${featured.id}`} className="btn btn-primary">
                Play
              </Link>
              <Link href={`/watch/${featured.id}`} className="btn btn-secondary">
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
            <p>Please check your configuration or try again later.</p>
          </div>
        ) : (
          rows.map((row, idx) => (
            row.contents && row.contents.length > 0 && (
              <section key={`${row.name}-${idx}`} className="section">
                <h2 className="section-header">{row.name}</h2>
                <div className="horizontal-scroll">
                  {row.contents.map((content, cIdx) => (
                    <Card
                      key={`${content.id}-${cIdx}`}
                      id={content.id}
                      title={content.title!}
                      image={content.coverImage!}
                    />
                  ))}
                </div>
              </section>
            )
          ))
        )}
      </div>
    </>
  );
}
