import mockJson from '@/data/hostaway.json';
import { normalizeHostaway } from './normalize';

/**
 * Fetch reviews from Hostaway and normalize them.
 * Falls back to bundled mock data when the API is unavailable or empty.
 */
export async function fetchHostawayNormalized() {
  const accountId = process.env.HOSTAWAY_ACCOUNT_ID;
  const apiKey = process.env.HOSTAWAY_API_KEY;

  if (accountId && apiKey) {
    try {
      const url = `https://api.hostaway.com/v1/reviews?accountId=${accountId}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const json = await res.json();
        const normalized = normalizeHostaway(json);
        if (normalized.length > 0) return normalized;
      }
    } catch (err) {
      // fall back to mock data
      console.error('Hostaway fetch failed, using mock data', err);
    }
  }

  // fallback to mock data when fetch fails or returns no items
  return normalizeHostaway(mockJson);
}
