import { z } from 'zod';
import type { NormalizedReview } from './types';

// google places API schemas
const GoogleReviewSchema = z.object({
  author_name: z.string().optional(),
  rating: z.number().optional(),
  text: z.string().optional(),
  time: z.number().optional(), // Unix timestamp (seconds)
});

const GoogleResultSchema = z.object({
  name: z.string().optional(),
  place_id: z.string().optional(),
  reviews: z.array(GoogleReviewSchema).optional(),
});

const GoogleResponseSchema = z.object({
  status: z.string(),
  result: GoogleResultSchema.optional(),
});

export async function fetchGoogleNormalized(placeId: string, apiKey: string) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,place_id,reviews&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google API error: ${res.status}`);
  }
  const json = await res.json();
  return normalizeGoogle(json);
}

export function normalizeGoogle(json: unknown): NormalizedReview[] {
  const parsed = GoogleResponseSchema.safeParse(json);
  if (!parsed.success || !parsed.data.result) {
    throw new Error('Invalid Google response');
  }
  const { result } = parsed.data;
  const list = result?.reviews ?? [];

  return list.map(
    (r, idx): NormalizedReview => ({
      id: String(r.time ?? idx),
      source: 'google',
      type: 'guest',
      status: 'published',
      rating: typeof r.rating === 'number' ? r.rating : null,
      categories: [],
      submittedAt: r.time ? new Date(r.time * 1000).toISOString() : '',
      authorName: r.author_name ?? null,
      listingId: result?.place_id ?? null,
      listingName: result?.name ?? null,
      channel: 'google',
      content: r.text ?? '',
    }),
  );
}
