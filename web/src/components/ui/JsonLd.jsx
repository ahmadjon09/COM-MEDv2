// schema.org JSON-LD ni sahifaga joylash uchun kichik komponent.
export default function JsonLd({ data }) {
  if (!data) return null;
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Ma'lumot bizning serverimizdan keladi — XSS xavfi yo'q, lekin < belgisini ekranlaymiz
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, '\\u003c') }}
        />
      ))}
    </>
  );
}
