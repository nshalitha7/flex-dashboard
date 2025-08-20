'use client';

import type { NormalizedReview } from '@/domain/reviews';
import TrendChart from './TrendChart';
import ReviewCard from './ReviewCard';
import { bucketByMonth } from '@/domain/reviews';
import { useState } from 'react';

type Props = {
  listing: string;
  reviews: NormalizedReview[];
  approvals: Record<string, boolean>;
  onToggle: (id: string) => void;
};

function avg(nums: (number | null | undefined)[]) {
  const vals = nums.filter((x): x is number => typeof x === 'number');
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function categoryAverages(reviews: NormalizedReview[]) {
  const map = new Map<string, number[]>();
  for (const r of reviews) {
    for (const c of r.categories ?? []) {
      if (!map.has(c.category)) map.set(c.category, []);
      if (typeof c.rating === 'number') map.get(c.category)!.push(c.rating);
    }
  }
  return [...map.entries()].map(([cat, arr]) => ({
    category: cat,
    avg: arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null,
  }));
}

export default function ListingGroup({ listing, reviews, approvals, onToggle }: Props) {
  const average = avg(reviews.map((r) => r.rating)) ?? 0;
  const monthly = bucketByMonth(reviews);
  const categories = categoryAverages(reviews)
    .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0))
    .slice(0, 6);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? reviews : reviews.slice(0, 4);

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h2 className="text-lg font-semibold">{listing}</h2>
        <div className="text-sm">
          Avg Rating: <span className="font-medium">{average.toFixed(2)}</span> · {reviews.length}{' '}
          reviews
        </div>
      </div>

      <TrendChart data={monthly} />

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <span
            key={c.category}
            className={`px-2 py-1 rounded text-sm ${c.avg != null && c.avg < 8 ? 'bg-red-100' : 'bg-gray-100'}`}
            title={c.avg != null ? `Avg ${c.avg.toFixed(1)}` : 'No data'}
          >
            {c.category}
            {c.avg != null ? ` (${c.avg.toFixed(1)})` : ''}
          </span>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {visible.map((r) => (
          <ReviewCard key={r.id} review={r} approved={!!approvals[r.id]} onToggle={onToggle} />
        ))}
      </div>

      {reviews.length > visible.length && (
        <div className="text-center">
          <button
            className="px-3 py-2 rounded border bg-white hover:bg-gray-50"
            onClick={() => setShowAll(true)}
          >
            Show {reviews.length - visible.length} more in this listing
          </button>
        </div>
      )}
    </div>
  );
}
