export function reviewKey(
  listingId: number | string | null | undefined,
  reviewId: string | number,
): string {
  return `${listingId ?? ''}:${reviewId}`;
}

export default reviewKey;
