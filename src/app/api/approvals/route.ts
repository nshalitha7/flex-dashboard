import { NextRequest, NextResponse } from 'next/server';
import { approvalsStore } from '@/lib/approvals-store';
import type { ApprovalRecord } from '@/domain/reviews/types';

export async function GET(req: NextRequest) {
  const store = await approvalsStore();
  const { searchParams } = new URL(req.url);
  const listingIdParam = searchParams.get('listingId');
  const listingId = Number(listingIdParam);
  if (listingIdParam != null && listingIdParam != '' && Number.isFinite(listingId)) {
    const list = await store.listByListing(listingId);
    return NextResponse.json({ status: 'success', result: list });
  }
  const all = await store.loadAll();
  return NextResponse.json({ status: 'success', result: all });
}

export async function POST(req: NextRequest) {
  const store = await approvalsStore();
  const body = (await req.json()) as Partial<ApprovalRecord>;
  if (!body || body.listingId == null || body.reviewId == null || body.approved == undefined) {
    return Response.json({ status: 'error', message: 'Invalid body' }, { status: 400 });
  }
  const rec: ApprovalRecord = {
    listingId: Number(body.listingId),
    reviewId: body.reviewId!,
    approved: Boolean(body.approved),
    approvedAt: new Date().toISOString(),
  };
  await store.upsert(rec);
  return NextResponse.json({ status: 'success', result: rec });
}
