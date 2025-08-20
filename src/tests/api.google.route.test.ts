import * as process from 'node:process';

jest.mock('@/domain/reviews', () => {
  const real = jest.requireActual('@/domain/reviews');
  return {
    ...real,
    fetchGoogleNormalized: jest.fn(async () => [
      {
        id: '1',
        source: 'google',
        type: 'guest',
        status: 'published',
        rating: 5,
        categories: [],
        submittedAt: new Date('2024-01-10T00:00:00Z').toISOString(),
        authorName: 'Amy',
        listingId: 'p1',
        listingName: 'Test Place',
        channel: 'google',
        content: 'Great!',
      },
      {
        id: '2',
        source: 'google',
        type: 'guest',
        status: 'published',
        rating: 4,
        categories: [],
        submittedAt: new Date('2024-02-05T00:00:00Z').toISOString(),
        authorName: 'Bob',
        listingId: 'p1',
        listingName: 'Test Place',
        channel: 'google',
        content: 'Good.',
      },
      {
        id: '3',
        source: 'google',
        type: 'guest',
        status: 'published',
        rating: 3,
        categories: [],
        submittedAt: new Date('2023-12-15T00:00:00Z').toISOString(),
        authorName: 'Cara',
        listingId: 'p1',
        listingName: 'Test Place',
        channel: 'google',
        content: 'Ok.',
      },
    ]),
  };
});

import { GET } from '@/app/api/reviews/google/route';

function makeReq(url: string) {
  return { url } as unknown as Request;
}

beforeAll(() => {
  process.env.GOOGLE_API_KEY = 'test';
});

describe('GET /api/reviews/google', () => {
  it('returns normalized items with default paging', async () => {
    const url = new URL('http://localhost/api/reviews/google');
    url.searchParams.set('placeId', 'p1');
    const res = await GET(makeReq(url.toString()));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('success');
    expect(body.count).toBe(3);
    expect(body.page).toBe(1);
    expect(body.perPage).toBe(20);
    expect(Array.isArray(body.result)).toBe(true);
    expect(body.result.length).toBe(3);
  });

  it('applies filters, sorting, and pagination', async () => {
    const url = new URL('http://localhost/api/reviews/google');
    url.searchParams.set('placeId', 'p1');
    url.searchParams.set('minRating', '4');
    url.searchParams.set('sort', 'rating');
    url.searchParams.set('page', '1');
    url.searchParams.set('perPage', '1');

    const res = await GET(makeReq(url.toString()));
    const body = await res.json();

    expect(body.status).toBe('success');
    expect(body.count).toBeGreaterThanOrEqual(1);
    expect(body.page).toBe(1);
    expect(body.perPage).toBe(1);
    expect(body.result.length).toBeLessThanOrEqual(1);
    if (body.result.length) {
      expect(body.result[0].rating).toBeGreaterThanOrEqual(4);
    }
  });
});
