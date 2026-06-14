import siteData from "../data/site-data.json";

export default function Hero() {
  const { restaurant, content, images } = siteData;

  return (
    <section className="relative overflow-hidden bg-sand">
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span className="inline-block rounded-full bg-terra/15 px-4 py-1.5 text-sm font-semibold text-terradark">
            {restaurant.cuisine || restaurant.tagline} 🔥
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight sm:text-6xl">
            {content.welcomeHeading || restaurant.name}
          </h1>
          {content.welcomeSubtext && (
            <p className="mt-4 max-w-md text-lg text-coffee/75">{content.welcomeSubtext}</p>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="/#speisekarte"
              className="rounded-full bg-terra px-8 py-4 font-display font-bold text-white shadow-lg shadow-terra/30 transition-all hover:bg-terradark"
            >
              {content.orderCta || "Jetzt bestellen"} →
            </a>
            <a href="/#kontakt" className="font-semibold underline underline-offset-4 hover:text-terra">
              Öffnungszeiten
            </a>
          </div>
        </div>

        {images.hero ? (
          <img
            src={images.hero}
            alt={restaurant.name}
            className="h-80 w-full rounded-3xl object-cover shadow-2xl md:h-96"
          />
        ) : (
          <div className="flex h-80 w-full items-center justify-center rounded-3xl bg-gradient-to-br from-terra to-terradark md:h-96">
            <span className="text-8xl">🍕</span>
          </div>
        )}
      </div>
    </section>
  );
}
