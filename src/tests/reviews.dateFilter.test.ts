import mock from '@/data/hostaway.json';
import { normalizeHostaway, filterReviews } from '@/domain/reviews';

describe('filterReviews date filtering', () => {
  const norm = normalizeHostaway(mock as unknown);

  it('includes reviews on the end date when filtering with "to"', () => {
    const date = '2020-08-21';
    const filtered = filterReviews(norm, { to: date });
    expect(filtered.some((r) => r.submittedAt.startsWith(date))).toBe(true);
  });
});
