import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Checkout from "../../components/Checkout";
import siteData from "../../data/site-data.json";

export const metadata = {
  title: `Bestellen — ${siteData.restaurant.name}`,
};

export default function BestellenPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-center font-display text-4xl font-extrabold">Deine Bestellung</h1>
        <Checkout />
      </main>
      <Footer />
    </>
  );
}
