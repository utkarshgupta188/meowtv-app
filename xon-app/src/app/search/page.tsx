import Card from '@/components/Card';
import { searchMerged } from '@/lib/merged';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? '').trim();

  const results = query ? await searchMerged(query) : [];

  return (
    <div className="container">
      <h2 className="section-header">{query ? `Results for "${query}"` : 'Search'}</h2>

      {!query ? <p>Type something in the search bar to start.</p> : null}

      {query && results.length === 0 ? <p>No results found.</p> : null}

      <div className="grid">
        {results.map((item) => (
          <Card key={item.id} id={item.id} title={item.title || item.id} image={item.poster} />
        ))}
      </div>
    </div>
  );
}
