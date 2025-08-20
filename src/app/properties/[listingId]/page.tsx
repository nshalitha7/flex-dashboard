import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { fmtDate } from '@/lib/format';
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

// Next 15: params is a Promise
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
  const listingName = approved[0]?.listingName ?? `Property #${id}`;

  // rating summary (convert 10 to 5 star)
  const ratings = approved.map((r) => r.rating).filter((n): n is number => typeof n === 'number');
  const avg10 = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  const avg5 = avg10 != null ? avg10 / 2 : null;
  const reviewCount = approved.length;

  const Star = ({ filled }: { filled: boolean }) => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={filled ? 'fill-yellow-400' : 'fill-gray-300'}
    >
      <path d="M10 15.27 15.18 18l-1.64-5.27L18 8.99l-5.38-.01L10 3.5 7.38 8.98 2 8.99l4.46 3.74L4.82 18z" />
    </svg>
  );

  const renderStars = (score5: number | null) => {
    const s = score5 ?? 0;
    const full = Math.floor(s);
    const stars = Array.from({ length: 5 }, (_, i) => i < full);
    return (
      <div className="flex items-center gap-1">
        {stars.map((f, i) => (
          <Star key={i} filled={f} />
        ))}
        {avg5 != null && <span className="ml-1 text-sm text-gray-600">{avg5.toFixed(2)}</span>}
        <span className="text-sm text-gray-500">({reviewCount})</span>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-4">
        <Link href="/dashboard" className="text-blue-600">
          ← Back to dashboard
        </Link>
      </div>

      <header className="mb-6">
        <h1 className="text-3xl font-semibold">{listingName}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
          {renderStars(avg5)}
        </div>
      </header>

      {/* Reviews */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Reviews</h2>
          {renderStars(avg5)}
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
          <div className="space-y-3">
            {approved.map((r) => (
              <article key={String(r.id)} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium">{r.guestName ?? 'Guest'}</h3>
                  {typeof r.rating === 'number' && (
                    <span className="text-sm text-gray-600">Rating: {r.rating}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {r.submittedAt ? fmtDate(r.submittedAt) : ''}
                </div>
                <p className="text-gray-800 mt-2">{r.content}</p>
                <div className="flex gap-2 mt-3">
                  <span className="px-2 py-0.5 text-xs rounded bg-gray-100">{r.channel}</span>
                  <span className="px-2 py-0.5 text-xs rounded bg-gray-100">{r.type}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
