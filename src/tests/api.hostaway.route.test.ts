// mock only the data provider to keep the route deterministic.
jest.mock('@/domain/reviews', () => {
  const real = jest.requireActual('@/domain/reviews');
  return {
    ...real,
    fetchHostawayNormalized: jest.fn(async () => [
      {
        id: '1',
        source: 'hostaway',
        type: 'guest',
        status: 'published',
        rating: 9,
        categories: [],
        submittedAt: new Date('2024-01-10T00:00:00Z').toISOString(),
        authorName: 'Alice',
        listingId: '100',
        listingName: 'Shoreditch Heights',
        channel: 'hostaway',
        content: 'Great stay!',
      },
      {
        id: '2',
        source: 'hostaway',
        type: 'guest',
        status: 'published',
        rating: 7,
        categories: [],
        submittedAt: new Date('2024-02-05T00:00:00Z').toISOString(),
        authorName: 'Bob',
        listingId: '200',
        listingName: 'Soho Loft',
        channel: 'airbnb',
        content: 'Good location.',
      },
      {
        id: '3',
        source: 'hostaway',
        type: 'guest-to-host',
        status: 'published',
        rating: 10,
        categories: [],
        submittedAt: new Date('2023-12-15T00:00:00Z').toISOString(),
        authorName: 'Cara',
        listingId: '100',
        listingName: 'Shoreditch Heights',
        channel: 'hostaway',
        content: 'Fantastic!',
      },
    ]),
  };
});

import { GET } from '@/app/api/reviews/hostaway/route';

function makeReq(url: string) {
  // The route uses only req.url; we can pass a minimal object.
  return { url } as unknown as Request;
}

describe('GET /api/reviews/hostaway', () => {
  it('returns normalized items with default paging', async () => {
    const res = await GET(makeReq('http://localhost/api/reviews/hostaway'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('success');
    expect(body.count).toBe(3);
    expect(body.page).toBe(1);
    expect(body.perPage).toBe(1);
    expect(Array.isArray(body.result)).toBe(true);
    expect(body.result.length).toBe(1);
  });

  it('applies filters, sorting, and pagination', async () => {
    const url = new URL('http://localhost/api/reviews/hostaway');
    url.searchParams.set('minRating', '8');
    url.searchParams.set('listingName', 'shoreditch');
    url.searchParams.set('sort', 'rating');
    url.searchParams.set('page', '1');
    url.searchParams.set('perPage', '1');

    const res = await GET(makeReq(url.toString()));
    const body = await res.json();

    expect(body.status).toBe('success');
    expect(body.count).toBeGreaterThanOrEqual(1); // total after filters
    expect(body.page).toBe(1);
    expect(body.perPage).toBe(1);
    expect(body.result.length).toBeLessThanOrEqual(1);
    // top result should be Shoreditch with rating >= 8
    if (body.result.length) {
      expect(body.result[0].listingName.toLowerCase()).toContain('shoreditch');
      expect(body.result[0].rating).toBeGreaterThanOrEqual(8);
    }
  });
});
