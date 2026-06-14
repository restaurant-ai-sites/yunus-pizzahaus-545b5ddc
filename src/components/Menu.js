"use client";

import { useState } from "react";
import siteData from "../data/site-data.json";
import { addToCart } from "../lib/cart";

function MenuItem({ item }) {
  const [added, setAdded] = useState(false);

  if (typeof item === "string" || !item?.price) {
    return <li className="py-3">{item?.name || item}</li>;
  }

  function add() {
    addToCart(item.name, item.price);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <li className="flex items-center justify-between gap-4 rounded-2xl bg-cream p-4 shadow-sm">
      <div className="min-w-0">
        <p className="font-display font-semibold">{item.name}</p>
        {item.description && (
          <p className="mt-0.5 text-sm text-coffee/65">{item.description}</p>
        )}
        <p className="mt-1 font-bold text-terra">{item.price}</p>
      </div>
      <button
        onClick={add}
        className={`shrink-0 rounded-full px-5 py-2.5 font-display text-sm font-bold transition-all ${
          added ? "bg-green-600 text-white" : "bg-terra text-white hover:bg-terradark"
        }`}
      >
        {added ? "✓" : "+ Hinzufügen"}
      </button>
    </li>
  );
}

export default function Menu() {
  const sections = Array.isArray(siteData.menu) ? siteData.menu : [];
  if (sections.length === 0) return null;

  return (
    <section id="speisekarte" className="bg-sand/60 py-20">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-center font-display text-3xl font-extrabold sm:text-4xl">
          Speisekarte
        </h2>
        <p className="mt-2 text-center text-coffee/65">
          Wähle deine Favoriten und bestelle direkt online.
        </p>

        <div className="mt-10 space-y-10">
          {sections.map((section, i) => (
            <div key={i}>
              <h3 className="mb-4 font-display text-xl font-bold text-terradark">
                {section.title || section.name || `Kategorie ${i + 1}`}
              </h3>
              <ul className="space-y-3">
                {(section.items || []).map((item, j) => (
                  <MenuItem key={j} item={item} />
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="/bestellen"
            className="inline-block rounded-full bg-terra px-10 py-4 font-display font-bold text-white shadow-lg shadow-terra/30 transition-colors hover:bg-terradark"
          >
            Zum Warenkorb →
          </a>
        </div>
      </div>
    </section>
  );
}
