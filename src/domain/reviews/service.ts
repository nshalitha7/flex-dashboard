import mockJson from '@/data/hostaway.json';
import { normalizeHostaway } from './normalize';

/**
 * normalize the provided mock.
 * Later: plug real fetch here and fallback to mock if empty/error.
 */
export async function fetchHostawayNormalized() {
  // If later enable live fetch, do it here, validate with zod, and fallback to mock.
  return normalizeHostaway(mockJson);
}
