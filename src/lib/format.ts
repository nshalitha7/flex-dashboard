import { format } from 'date-fns';

export function fmtDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(+d) ? '' : format(d, 'MMM d, yyyy');
}
