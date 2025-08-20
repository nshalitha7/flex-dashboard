'use client';

import type { NormalizedReview } from '@/domain/reviews';
import { fmtDate } from '@/lib/format';

type Props = {
  review: NormalizedReview;
  approved: boolean;
  onToggle: (id: string) => void;
};

export default function ReviewCard({ review, approved, onToggle }: Props) {
  return (
    <div className="border rounded p-3 flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <div className="font-medium">{review.authorName || 'Guest'}</div>
        <div className="text-sm">Rating: {review.rating ?? '-'}</div>
      </div>
      <div className="text-sm opacity-70">{fmtDate(review.submittedAt)}</div>
      <p className="mt-1">{review.content}</p>

      <div className="flex items-center gap-3 text-sm mt-2">
        <span className="px-2 py-0.5 bg-gray-100 rounded">{review.channel}</span>
        <span className="px-2 py-0.5 bg-gray-100 rounded">{review.type}</span>
        <label className="ml-auto flex items-center gap-2">
          <input type="checkbox" checked={approved} onChange={() => onToggle(review.id)} />
          Show on website
        </label>
      </div>
    </div>
  );
}
