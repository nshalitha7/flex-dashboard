export type ApprovalsMap = Record<string, boolean>;
const KEY = 'approvals';

export function loadApprovals(): ApprovalsMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ApprovalsMap) : {};
  } catch {
    return {};
  }
}

export function saveApprovals(map: ApprovalsMap) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function toggleApproval(current: ApprovalsMap, id: string): ApprovalsMap {
  const next = { ...current, [id]: !current[id] };
  saveApprovals(next);
  return next;
}
