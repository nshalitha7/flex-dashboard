'use client';

import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { useEffect, useMemo, useState } from 'react';
import { fetchJSON } from '@/lib/fetcher';
import type { NormalizedReview, SortKey, ReviewType } from '@/domain/reviews';
import DashboardFilters, { Filters } from '@/components/DashboardFilters';
import ListingGroup from '@/components/ListingGroup';
import { reviewKey } from '@/lib/review-key';
import type { ApprovalRecord } from '@/domain/reviews';

type ApiResponse = {
  status: 'success' | 'error';
  message?: string;
  count: number; // items in this page
  page: number;
  perPage: number;
  result: NormalizedReview[];
  total?: number; // items across all pages (after filters)
};

// approvals map is keyed by `${listingId}:${reviewId}`
type ApprovalsMap = Record<string, boolean>;

function buildQueryBase(f: Filters) {
  const params = new URLSearchParams();
  if (f.minRating !== '' && f.minRating != null) params.set('minRating', String(f.minRating));
  if (f.listingName) params.set('listingName', f.listingName);
  if (f.channel) params.set('channel', f.channel);
  if (f.type) params.set('type', f.type);
  if (f.from) params.set('from', f.from);
  if (f.to) params.set('to', f.to);
  if (f.search) params.set('search', f.search);
  if (f.sort) params.set('sort', f.sort);
  if (f.category) {
    params.set('category', f.category);
    if (f.categoryMin !== '' && f.categoryMin != null)
      params.set('categoryMin', String(f.categoryMin));
  }
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
    category: '',
    categoryMin: '',
  });

  // load approvals
  const { data: approvalsRes } = useSWR<{ status: 'success'; result: ApprovalRecord[] }>(
    '/api/approvals',
    fetchJSON,
  );

  const [approvals, setApprovals] = useState<ApprovalsMap>({});
  useEffect(() => {
    if (!approvalsRes?.result) return;
    const m: ApprovalsMap = {};
    for (const a of approvalsRes.result) {
      m[reviewKey(a.listingId, a.reviewId)] = !!a.approved;
    }
    setApprovals(m);
  }, [approvalsRes]);

  const base = buildQueryBase(filters);
  const perPage = 20;

  const getKey = (pageIndex: number, previousPageData: ApiResponse | null) => {
    if (previousPageData && previousPageData.result.length < perPage) return null;
    const page = pageIndex + 1;
    return `/api/reviews/hostaway?${base}&page=${page}&perPage=${perPage}`;
  };

  const { data, error, isLoading, size, setSize, isValidating } = useSWRInfinite<ApiResponse>(
    getKey,
    fetchJSON,
    {
      revalidateFirstPage: true,
      keepPreviousData: true,
      revalidateOnFocus: false,
      dedupingInterval: 3000,
    },
  );

  const flat: NormalizedReview[] = useMemo(() => (data ?? []).flatMap((d) => d.result), [data]);

  // build listing groups
  const grouped = useMemo(() => {
    const map = new Map<string, { listingId: string | number | null; items: NormalizedReview[] }>();
    for (const r of flat) {
      const key = r.listingName || 'Unknown Listing';
      if (!map.has(key)) map.set(key, { listingId: r.listingId ?? null, items: [] });
      map.get(key)!.items.push(r);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([listing, obj]) => ({ listing, listingId: obj.listingId, reviews: obj.items }));
  }, [flat]);

  const totalAfterFilters = data?.[0]?.total ?? 0;
  const last = data?.[data?.length - 1];
  const isEnd = !!last && last.result.length < perPage;

  const onToggle = (compositeKey: string) =>
    setApprovals((curr) => ({ ...curr, [compositeKey]: !curr[compositeKey] }));

  // KPI bar
  const uniqueListings = grouped.length;
  const rated = flat.filter((r) => typeof r.rating === 'number');
  const overallAvg = rated.length
    ? (rated.reduce((s, r) => s + (r.rating as number), 0) / rated.length).toFixed(2)
    : '–';
  const approvedCount = Object.values(approvals).filter(Boolean).length;

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Flex Reviews Dashboard</h1>
        <div className="text-sm opacity-70">
          {isLoading && !data
            ? 'Loading…'
            : error
              ? 'Error loading'
              : `${totalAfterFilters} reviews`}
        </div>
      </header>

      {/* KPI bar */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded p-3">
          <div className="text-xs text-gray-500">Listings</div>
          <div className="text-lg font-medium">{uniqueListings}</div>
        </div>
        <div className="border rounded p-3">
          <div className="text-xs text-gray-500">Avg rating</div>
          <div className="text-lg font-medium">{overallAvg}</div>
        </div>
        <div className="border rounded p-3">
          <div className="text-xs text-gray-500">Approved</div>
          <div className="text-lg font-medium">{approvedCount}</div>
        </div>
        <div className="border rounded p-3">
          <div className="text-xs text-gray-500">Loaded now</div>
          <div className="text-lg font-medium">{flat.length}</div>
        </div>
      </section>

      <div className="top-4 z-10 border rounded p-3">
        <DashboardFilters
          value={filters}
          onChange={(next) => {
            setSize(1); // reset pagination when filters change
            setFilters(next);
          }}
        />
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 rounded p-3">
          Failed to load reviews.
        </div>
      )}

      {!error && isLoading && !data && (
        <div className="border rounded p-4 bg-gray-50">Loading reviews…</div>
      )}

      {data && flat.length === 0 && (
        <div className="border rounded p-4 bg-yellow-50">No reviews match the current filters.</div>
      )}

      {grouped.map(({ listing, listingId, reviews }) => (
        <ListingGroup
          key={`${listing}-${listingId ?? 'n/a'}`}
          listing={listing}
          reviews={reviews}
          approvals={approvals}
          onToggle={onToggle}
        />
      ))}

      {flat.length > 0 && (
        <div className="flex items-center justify-center pt-2">
          <button
            className="px-4 py-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
            disabled={isEnd || isValidating}
            onClick={() => setSize(size + 1)}
          >
            {isEnd ? 'No more reviews' : isValidating ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </main>
  );
}
