'use client';

import { useState } from 'react';
import type { NormalizedReview } from '@/domain/reviews';
import { fmtDate } from '@/lib/format';

type Props = {
  review: NormalizedReview;
  approved: boolean;
  onToggle: (id: string) => void;
};

export default function ReviewCard({ review, approved, onToggle }: Props) {
  const [saving, setSaving] = useState(false);

  async function handleToggle(next: boolean) {
    // optimistic UI first
    onToggle(review.id);

    setSaving(true);
    try {
      // persist to server so public page can read it
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: review.listingId, // <- required by the API
          reviewId: review.id,
          approved: next,
        }),
      });

      if (!res.ok) {
        // revert if server failed
        onToggle(review.id);
        console.error('Failed to save approval', await res.text());
      }
    } catch (e) {
      // revert if network error
      onToggle(review.id);
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
    </div>
  );
}
