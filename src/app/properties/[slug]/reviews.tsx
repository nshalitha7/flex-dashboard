'use client';

import useSWR from 'swr';
import { fetchJSON } from '@/lib/fetcher';
import type { NormalizedReview } from '@/domain/reviews';
import { loadApprovals } from '@/lib/storage';
import { useEffect, useMemo, useState } from 'react';
import { fmtDate } from '@/lib/format';

type ApiResponse = {
  status: 'success' | 'error';
  message?: string;
  count: number;
  page: number;
  perPage: number;
  result: NormalizedReview[];
};

export default function Reviews({ listingName }: { listingName: string }) {
  const qs = new URLSearchParams({ listingName, perPage: '100', sort: 'newest' }).toString();
  const { data, error, isLoading } = useSWR<ApiResponse>(`/api/reviews/hostaway?${qs}`, fetchJSON);

  const [approvals, setApprovals] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setApprovals(loadApprovals());
  }, []);

  const approved = useMemo(
    () => (data?.result ?? []).filter((r) => approvals[r.id]),
    [data, approvals],
  );

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 text-red-700 rounded p-3">
        Failed to load reviews.
      </div>
    );
  }
  if (isLoading || !data) {
    return <div className="border rounded p-4 bg-gray-50">Loading reviews…</div>;
  }
  if (approved.length === 0) {
    return <div className="border rounded p-4 bg-yellow-50">No approved reviews yet.</div>;
  }

  return (
    <div className="space-y-3">
      {approved.map((r) => (
        <div key={r.id} className="border rounded p-3">
          <div className="flex justify-between">
            <div className="font-medium">{r.authorName || 'Guest'}</div>
            <div className="text-sm">Rating: {r.rating ?? '-'}</div>
          </div>
          <div className="text-sm opacity-70">{fmtDate(r.submittedAt)}</div>
          <p className="mt-2">{r.content}</p>
        </div>
      ))}
    </div>
  );
}
