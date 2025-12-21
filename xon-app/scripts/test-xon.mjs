// Quick sanity test for the Xon endpoints.
// Run: node scripts/test-xon.mjs

const DEFAULT_BASE = 'http://myavens18052002.xyz/nzapis';
const DEFAULT_API = '553y845hfhdlfhjkl438943943839443943fdhdkfjfj9834lnfd98';

async function authenticateAndGetSettings() {
  try {
    const authRes = await fetch(
      'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyAC__yhrI4ExLcqWbZjsLN33_gVgyp6w3A',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) }
    );
    const auth = await authRes.json();

    const settingsRes = await fetch(
      'https://firestore.googleapis.com/v1/projects/xon-app/databases/(default)/documents/settings/BvJwsNb0eaObbigSefkm',
      { headers: { Authorization: `Bearer ${auth.idToken}` } }
    );
    const settings = await settingsRes.json();

    return {
      base: settings?.fields?.base?.stringValue || DEFAULT_BASE,
      api: settings?.fields?.api?.stringValue || DEFAULT_API,
    };
  } catch {
    return { base: DEFAULT_BASE, api: DEFAULT_API };
  }
}

function headers(api) {
  return {
    api,
    'Cache-Control': 'no-cache',
    caller: 'vion-official-app',
    Connection: 'Keep-Alive',
    Host: 'myavens18052002.xyz',
    'User-Agent': 'okhttp/3.14.9',
  };
}

async function fetchJson(url, hdrs) {
  const res = await fetch(url, { headers: hdrs });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

const { base, api } = await authenticateAndGetSettings();
const b = String(base).replace(/\/+$/, '');

console.log('Using base:', b);
console.log('API key length:', String(api).length);

const hdrs = headers(api);

const [languages, shows, seasons, episodesResp, movies] = await Promise.all([
  fetchJson(`${b}/nzgetlanguages.php`, hdrs),
  fetchJson(`${b}/nzgetshows.php`, hdrs),
  fetchJson(`${b}/nzgetseasons.php`, hdrs),
  fetchJson(`${b}/nzgetepisodes_v2.php?since=`, hdrs),
  fetchJson(`${b}/nzgetmovies.php`, hdrs),
]);

console.log('Counts:', {
  languages: Array.isArray(languages) ? languages.length : null,
  shows: Array.isArray(shows) ? shows.length : null,
  seasons: Array.isArray(seasons) ? seasons.length : null,
  episodes: Array.isArray(episodesResp?.episodes) ? episodesResp.episodes.length : null,
  movies: Array.isArray(movies) ? movies.length : null,
});

const firstMovie = Array.isArray(movies) ? movies[0] : null;
if (firstMovie) {
  console.log('Sample movie:', {
    id: firstMovie.id,
    name: firstMovie.name,
    basic: firstMovie.basic,
    sd: firstMovie.sd,
    hd: firstMovie.hd,
    fhd: firstMovie.fhd,
  });
}
