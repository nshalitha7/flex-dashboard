export type ReviewCategory = { category: string; rating: number | null };

export type ReviewType = 'host-to-guest' | 'guest-to-host' | 'guest';
export type ReviewStatus = 'published' | 'pending' | 'hidden' | 'archived';
export type ReviewSource = 'hostaway' | 'google' | 'booking' | 'airbnb';

export type NormalizedReview = {
  id: string;
  source: ReviewSource;
  type: ReviewType;
  status: ReviewStatus;
  rating: number | null;
  categories: ReviewCategory[];
  submittedAt: string; // ISO 8601
  authorName: string | null; // reviewer / guest name
  listingId: string | null;
  listingName: string | null;
  channel: string; // hostaway / airbnb / booking / google
  content: string; // review body
};

export type FilterQuery = {
  minRating?: number;
  channel?: string;
  type?: ReviewType;
  listingName?: string;
  search?: string;
  from?: string; // yyyy-mm-dd
  to?: string; // yyyy-mm-dd
};

export type SortKey = 'newest' | 'oldest' | 'rating';

// approvals - manager selections
export type ApprovalKey = { listingId: number; reviewId: number | string };
export type ApprovalRecord = ApprovalKey & { approved: boolean; approvedAt: string };
