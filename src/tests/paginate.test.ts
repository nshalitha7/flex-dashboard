import { paginate } from '@/lib/paginate';

describe('paginate', () => {
  const arr = Array.from({ length: 23 }, (_, i) => i + 1);

  it('paginates page 1', () => {
    const { slice, page, perPage, total } = paginate(arr, 1, 10);
    expect(slice).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(page).toBe(1);
    expect(perPage).toBe(10);
    expect(total).toBe(23);
  });

  it('paginates page 3', () => {
    const { slice, page } = paginate(arr, 3, 10);
    expect(slice).toEqual([21, 22, 23]);
    expect(page).toBe(3);
  });

  it('bounds perPage (max 100, min 1) and page (min 1)', () => {
    const a = paginate(arr, 0, 0);
    expect(a.page).toBe(1);
    expect(a.perPage).toBe(1);
    const b = paginate(arr, 1, 1000);
    expect(b.perPage).toBeLessThanOrEqual(100);
  });
});
