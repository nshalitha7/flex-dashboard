import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import * as process from 'node:process';

type Review = {
  id: number | string;
  listingId: number;
  listingName: string;
  channel: string;
  type: string;
  rating: number | null;
  content: string;
  guestName?: string | null;
  submittedAt?: string | null;
};

async function fetchApproved(listingId: number, baseUrl: string): Promise<Review[]> {
  const [reviewsRes, approvalsRes] = await Promise.all([
    fetch(`${baseUrl}/api/reviews/hostaway?listingId=${listingId}`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/approvals?listingId=${listingId}`, { cache: 'no-store' }),
  ]);
  const reviewsJson = await reviewsRes.json();
  const approvalsJson = await approvalsRes.json();

  const approvedSet = new Set(
    (approvalsJson.result as { reviewId: string | number; approved: boolean }[])
      .filter((a) => a.approved)
      .map((a) => `${listingId}:${a.reviewId}`),
  );

  const items = (reviewsJson.result as Review[]) ?? [];
  return items.filter((r) => approvedSet.has(`${listingId}:${r.id}`));
}

export const metadata: Metadata = { title: 'Property | Flex Living' };

export default async function PropertyPage({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  const id = Number(listingId);
  if (!Number.isFinite(id)) {
    return <div className="p-6">Invalid listing id.</div>;
  }

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL && process.env.NEXT_PUBLIC_BASE_URL.trim() !== ''
      ? process.env.NEXT_PUBLIC_BASE_URL
      : host
        ? `${proto}://${host}`
        : 'http://localhost:3000';

  const approved = await fetchApproved(id, baseUrl);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/dashboard" className="text-blue-600">
          ← Back to dashboard
        </Link>
        <h1 className="text-3xl font-semibold mt-3">Property #{id}</h1>
        <p className="text-gray-600">Only manager approved guest reviews are displayed below.</p>
      </div>

      {approved.length === 0 ? (
        <div className="border rounded p-6 bg-gray-50">
          <p>No approved reviews yet.</p>
          <p className="text-sm text-gray-600 mt-2">
            Go to the{' '}
            <Link href="/dashboard" className="underline">
              dashboard
            </Link>{' '}
            to approve reviews.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {approved.map((r) => (
            <article key={String(r.id)} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium">{r.guestName ?? 'Guest'}</h3>
                {r.rating != null && <span className="text-sm">Rating: {r.rating}</span>}
              </div>
              <p className="text-gray-800">{r.content}</p>
              <div className="flex gap-2 mt-3">
                <span className="px-2 py-0.5 text-xs rounded bg-gray-100">{r.channel}</span>
                <span className="px-2 py-0.5 text-xs rounded bg-gray-100">{r.type}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
