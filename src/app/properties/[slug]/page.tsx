import Reviews from './reviews';

export default function PropertyPage({ params }: { params: { slug: string } }) {
  const listingName = decodeURIComponent(params.slug);
  return (
    <main className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">{listingName}</h1>
      {/* Mimic Flex property details shell */}
      <section className="text-sm opacity-70">Property details content (placeholder)</section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Guest Reviews</h2>
        <Reviews listingName={listingName} />
      </section>
    </main>
  );
}
