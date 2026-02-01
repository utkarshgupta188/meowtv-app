import WatchClientWrapper from './WatchClientWrapper';

// Required for static export with dynamic routes
// Return at least one path (placeholder) to satisfy static export requirement
// Actual content is loaded client-side
export function generateStaticParams() {
    return [{ id: [] }]; // Empty catch-all matches /watch route
}

export default function WatchPage() {
    return <WatchClientWrapper />;
}
