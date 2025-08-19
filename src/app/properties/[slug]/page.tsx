type Props = { params: { slug: string } };

export default function PropertyPage({ params }: Props) {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Property: {decodeURIComponent(params.slug)}</h1>
      <section className="rounded border p-4">
        <h2 className="font-semibold">Guest Reviews</h2>
        <p className="text-sm text-gray-500">
          Reviews will appear here when approved in the dashboard.
        </p>
      </section>
    </main>
  );
}
