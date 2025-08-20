'use client';

import { useState } from 'react';
import type { NormalizedReview } from '@/domain/reviews';
import { fmtDate } from '@/lib/format';
import { reviewKey } from '@/lib/review-key';

type Props = {
  review: NormalizedReview;
  approved: boolean;
  onToggle: (compositeKey: string) => void; // `${listingId}:${reviewId}`
};

export default function ReviewCard({ review, approved, onToggle }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(next: boolean) {
    const compositeKey = reviewKey(review.listingId, review.id);

    onToggle(compositeKey);

    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: review.listingId,
          reviewId: review.id,
          approved: next,
        }),
      });
      if (!res.ok) {
        // revert on failure
        onToggle(compositeKey);
        setError('Failed to save approval');
        console.error('Failed to save approval', await res.text());
      }
    } catch (e) {
      onToggle(compositeKey);
      setError('Failed to save approval');
      console.error('Failed to save approval', e);
    } finally {
      setSaving(false);
    }
  }

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
          <input
            type="checkbox"
            aria-label="Show on website"
            checked={approved}
            disabled={saving}
            onChange={(e) => handleToggle(e.target.checked)}
          />
          {saving ? 'Saving…' : 'Show on website'}
        </label>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  );
}
