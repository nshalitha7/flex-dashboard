import mockJson from '@/data/hostaway.json';
import { normalizeHostaway } from './normalize';
import type { HostawayReviewRaw } from './normalize';

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getHostawayAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && tokenExpiry > now + 60 * 1000) {
    return cachedToken;
  }

  const accountId = process.env.HOSTAWAY_ACCOUNT_ID;
  const apiKey = process.env.HOSTAWAY_API_KEY;
  if (!accountId || !apiKey) {
    throw new Error('Hostaway API credentials missing');
  }

  const res = await fetch('https://api.hostaway.com/v1/accessTokens', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: accountId,
      client_secret: apiKey,
      scope: 'general',
    }),
  });

  if (!res.ok) {
    throw new Error(`Hostaway auth failed: ${res.status}`);
  }

  const json = (await res.json()) as {
    access_token?: string;
    token_type?: string;
    expires_in?: number;
  };
  const token = json.access_token;

  if (!token) {
    throw new Error('Hostaway auth token missing');
  }

  const expiresIn = Number(json.expires_in ?? 3600) * 1000;
  cachedToken = token;
  tokenExpiry = now + expiresIn;
  return token;
}

/**
 * Fetch reviews from Hostaway and normalize them.
 * Falls back to bundled mock data when the API is unavailable or empty.
 */
export async function fetchHostawayNormalized() {
  try {
    const token = await getHostawayAccessToken();
    const all: HostawayReviewRaw[] = [];
    const limit = 100;
    let offset = 0;

    while (true) {
      const url = `https://api.hostaway.com/v1/reviews?limit=${limit}&offset=${offset}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`Hostaway fetch failed: ${res.status}`);
      }

      const json = (await res.json()) as { result?: HostawayReviewRaw[] };
      const batch = Array.isArray(json.result) ? json.result : [];
      all.push(...batch);
      if (batch.length < limit) break;
      offset += limit;
    }

    const normalized = normalizeHostaway({ result: all });
    if (normalized.length > 0) {
      return normalized;
    }
  } catch (err) {
    console.error('Hostaway fetch failed, using mock data', err);
  }

  // fallback to mock data when fetch fails or returns no items
  return normalizeHostaway(mockJson);
}
