import mock from '@/data/hostaway.json';
import { normalizeHostaway, filterReviews } from '@/domain/reviews';

describe('filterReviews date filtering', () => {
  const norm = normalizeHostaway(mock as unknown);

  it('includes reviews on the end date when filtering with "to"', () => {
    const date = '2020-08-21';
    const filtered = filterReviews(norm, { to: date });
    expect(filtered.some((r) => r.submittedAt.startsWith(date))).toBe(true);
  });

  it('drops reviews with invalid submittedAt values', () => {
    const raw = { status: 'success', result: [{ submittedAt: 'not-a-date' }] };
    const [bad] = normalizeHostaway(raw);
    const filtered = filterReviews([bad], {});
    expect(filtered.length).toBe(0);
  });
});
