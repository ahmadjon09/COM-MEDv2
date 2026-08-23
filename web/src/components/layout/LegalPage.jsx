// Huquqiy sahifalar shabloni.
import Breadcrumbs from '../ui/Breadcrumbs';
import Reveal from '../ui/Reveal';
import Markdown from '../ui/Markdown';

export default function LegalPage({ locale, dict, title, content }) {
  return (
    <>
      <section className="border-b border-ink-150">
        <div className="wrap py-9 lg:py-12">
          <Breadcrumbs items={[{ name: dict.product.breadcrumbHome, href: `/${locale}` }, { name: title }]} />
          <Reveal>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-ink-900 md:text-4xl">{title}</h1>
            <p className="mt-3 kicker">
              {new Date().toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="wrap py-10 lg:py-14">
        <Reveal><Markdown content={content} /></Reveal>
      </section>
    </>
  );
}
