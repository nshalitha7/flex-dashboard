export function paginate<T>(list: T[], page = 1, perPage = 20) {
  const p = Math.max(1, page | 0);
  const pp = Math.min(100, Math.max(1, perPage | 0));
  const start = (p - 1) * pp;
  const end = start + pp;
  return { slice: list.slice(start, end), page: p, perPage: pp, total: list.length };
}
