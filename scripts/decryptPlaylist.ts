// Dev-only utility to fetch an HLS playlist and decrypt any enc2: tokens.
import { decryptPlaylist } from '../src/lib/enc2';

async function run() {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: ts-node scripts/decryptPlaylist.ts <playlist-url>');
    process.exit(1);
  }

  const res = await fetch(target, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (!res.ok) {
    console.error(`Failed to fetch playlist: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const text = await res.text();
  const decrypted = decryptPlaylist(text, target);

  console.log('----- DECRYPTED PLAYLIST -----');
  console.log(decrypted);
  console.log('----- END -----');
}

run().catch((err) => {
  console.error('Decrypt script error:', err);
  process.exit(1);
});
