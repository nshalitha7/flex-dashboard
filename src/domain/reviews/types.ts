export type ReviewCategory = { category: string; rating: number | null };

export type NormalizedReview = {
  id: string;
  source: 'hostaway' | 'google';
  type: string;
  status: string;
  overallRating: number | null;
  categories: ReviewCategory[];
  submittedAt: string; // ISO
  authorName: string | null;
  listingId: string | null;
  listingName: string | null;
  channel: string | null;
  content: string | null;
};

export type FilterQuery = {
  minRating?: number;
  channel?: string;
  type?: string;
  from?: string; // yyyy-mm-dd
  to?: string; // yyyy-mm-dd
  listingName?: string;
  sort?: 'newest' | 'oldest' | 'rating';
};
