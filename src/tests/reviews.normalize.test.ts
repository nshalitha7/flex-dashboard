import mock from '@/data/hostaway.json';
import { normalizeHostaway, filterReviews, sortReviews, bucketByMonth } from '@/domain/reviews';

describe('normalizeHostaway', () => {
  const norm = normalizeHostaway(mock as unknown);

  it('produces an array of normalized reviews', () => {
    expect(Array.isArray(norm)).toBe(true);
    expect(norm.length).toBeGreaterThan(0);
    const r = norm[0];
    expect(r).toHaveProperty('id');
    expect(r).toHaveProperty('source', 'hostaway');
    expect(r).toHaveProperty('submittedAt');
    expect(typeof r.content).toBe('string');
  });

  it('filters by minRating and listingName', () => {
    const filtered = filterReviews(norm, { minRating: 8, listingName: 'shoreditch' });
    expect(filtered.every((r) => (r.rating ?? -1) >= 8)).toBe(true);
    expect(filtered.every((r) => (r.listingName ?? '').toLowerCase().includes('shoreditch'))).toBe(
      true,
    );
  });

  it('sorts by rating desc', () => {
    const sorted = sortReviews(norm, 'rating');
    const ratings = sorted.map((r) => r.rating ?? -1);
    const copy = [...ratings].sort((a, b) => b - a);
    expect(ratings).toEqual(copy);
  });

  it('buckets by month for trends', () => {
    const buckets = bucketByMonth(norm);
    expect(Array.isArray(buckets)).toBe(true);
    if (buckets.length) {
      expect(buckets[0]).toHaveProperty('month');
      expect(buckets[0]).toHaveProperty('count');
    }
  });
});
