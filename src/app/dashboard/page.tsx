'use client';

import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';
import { fetchJSON } from '@/lib/fetcher';
import type { NormalizedReview, SortKey, ReviewType } from '@/domain/reviews';
import DashboardFilters, { Filters } from '@/components/DashboardFilters';
import ListingGroup from '@/components/ListingGroup';
import { loadApprovals, toggleApproval, type ApprovalsMap } from '@/lib/storage';

type ApiResponse = {
  status: 'success' | 'error';
  message?: string;
  count: number;
  page: number;
  perPage: number;
  result: NormalizedReview[];
  total?: number;
};

function buildQuery(f: Filters) {
  const params = new URLSearchParams();
  if (f.minRating !== '' && f.minRating != null) params.set('minRating', String(f.minRating));
  if (f.listingName) params.set('listingName', f.listingName);
  if (f.channel) params.set('channel', f.channel);
  if (f.type) params.set('type', f.type);
  if (f.from) params.set('from', f.from);
  if (f.to) params.set('to', f.to);
  if (f.search) params.set('search', f.search);
  if (f.sort) params.set('sort', f.sort);

  // load a lot at once, UI is still grouped
  params.set('perPage', '100');
  return params.toString();
}

export default function DashboardPage() {
  const [filters, setFilters] = useState<Filters>({
    minRating: '',
    listingName: '',
    channel: '',
    type: '' as ReviewType | '',
    from: '',
    to: '',
    search: '',
    sort: 'newest' as SortKey,
  });

  const [approvals, setApprovals] = useState<ApprovalsMap>({});

  // load approvals
  useEffect(() => {
    setApprovals(loadApprovals());
  }, []);

  const qs = buildQuery(filters);
  const { data, error, isLoading } = useSWR<ApiResponse>(`/api/reviews/hostaway?${qs}`, fetchJSON);

  const grouped = useMemo(() => {
    const map = new Map<string, NormalizedReview[]>();
    for (const r of data?.result ?? []) {
      const key = r.listingName || 'Unknown Listing';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }

    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [data]);

  const onToggle = (id: string) => setApprovals((curr) => toggleApproval(curr, id));

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Flex Reviews Dashboard</h1>
        <div className="text-sm opacity-70">
          {isLoading ? 'Loading…' : error ? 'Error loading' : `${data?.count ?? 0} reviews`}
        </div>
      </header>

      <DashboardFilters value={filters} onChange={setFilters} />

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 rounded p-3">
          Failed to load reviews.
        </div>
      )}

      {!error && (isLoading || !data) && (
        <div className="border rounded p-4 bg-gray-50">Loading reviews…</div>
      )}

      {!isLoading && data && data.result.length === 0 && (
        <div className="border rounded p-4 bg-yellow-50">No reviews match the current filters.</div>
      )}

      {!isLoading &&
        data &&
        grouped.map(([listing, reviews]) => (
          <ListingGroup
            key={listing}
            listing={listing}
            reviews={reviews}
            approvals={approvals}
            onToggle={onToggle}
          />
        ))}
    </main>
  );
}
