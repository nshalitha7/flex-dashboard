'use client';

import { useId } from 'react';
import type { SortKey, ReviewType } from '@/domain/reviews';

export type Filters = {
  minRating: number | '';
  listingName: string;
  channel: string;
  type: ReviewType | '';
  from: string;
  to: string;
  search: string;
  sort: SortKey;
};

type Props = {
  value: Filters;
  onChange: (next: Filters) => void;
};

export default function DashboardFilters({ value, onChange }: Props) {
  const id = useId();
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => onChange({ ...value, [k]: v });

  return (
    <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
      <div className="flex flex-col">
        <label htmlFor={`${id}-min`} className="text-sm">
          Min rating
        </label>
        <input
          id={`${id}-min`}
          type="number"
          min={0}
          max={10}
          value={value.minRating}
          onChange={(e) => set('minRating', e.target.value === '' ? '' : Number(e.target.value))}
          className="border rounded px-3 py-2"
          placeholder="e.g. 8"
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor={`${id}-listing`} className="text-sm">
          Listing
        </label>
        <input
          id={`${id}-listing`}
          value={value.listingName}
          onChange={(e) => set('listingName', e.target.value)}
          className="border rounded px-3 py-2"
          placeholder="Search listing name"
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor={`${id}-channel`} className="text-sm">
          Channel
        </label>
        <select
          id={`${id}-channel`}
          value={value.channel}
          onChange={(e) => set('channel', e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All</option>
          <option value="hostaway">Hostaway</option>
          <option value="airbnb">Airbnb</option>
          <option value="booking">Booking</option>
          <option value="google">Google</option>
        </select>
      </div>

      <div className="flex flex-col">
        <label htmlFor={`${id}-type`} className="text-sm">
          Type
        </label>
        <select
          id={`${id}-type`}
          value={value.type}
          onChange={(e) => set('type', e.target.value as Filters['type'])}
          className="border rounded px-3 py-2"
        >
          <option value="">All</option>
          <option value="guest">guest</option>
          <option value="guest-to-host">guest-to-host</option>
          <option value="host-to-guest">host-to-guest</option>
        </select>
      </div>

      <div className="flex flex-col">
        <label htmlFor={`${id}-from`} className="text-sm">
          From
        </label>
        <input
          id={`${id}-from`}
          type="date"
          value={value.from}
          onChange={(e) => set('from', e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor={`${id}-to`} className="text-sm">
          To
        </label>
        <input
          id={`${id}-to`}
          type="date"
          value={value.to}
          onChange={(e) => set('to', e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      <div className="flex flex-col md:col-span-2">
        <label htmlFor={`${id}-search`} className="text-sm">
          Search text
        </label>
        <input
          id={`${id}-search`}
          value={value.search}
          onChange={(e) => set('search', e.target.value)}
          className="border rounded px-3 py-2 w-full"
          placeholder="Search review content/author"
        />
      </div>

      <div className="flex flex-col md:col-span-1">
        <label htmlFor={`${id}-sort`} className="text-sm">
          Sort
        </label>
        <select
          id={`${id}-sort`}
          value={value.sort}
          onChange={(e) => set('sort', e.target.value as SortKey)}
          className="border rounded px-3 py-2"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="rating">Rating (desc)</option>
        </select>
      </div>
    </div>
  );
}
