"use client";

import { useEffect, useState } from "react";
import { addToCart } from "../lib/cart";

function euro(n) {
  return Number(n).toFixed(2).replace(".", ",") + " €";
}

function MenuItem({ item }) {
  const [added, setAdded] = useState(false);

  function add() {
    addToCart(item.name, euro(item.price));
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <li className="flex items-center justify-between gap-4 rounded-2xl bg-cream p-4 shadow-sm">
      {item.image_url && (
        <img src={item.image_url} alt={item.name} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-display font-semibold">{item.name}</p>
        {item.description && (
          <p className="mt-0.5 text-sm text-coffee/65">{item.description}</p>
        )}
        {item.is_menu && item.combo_items?.length > 0 && (
          <p className="mt-0.5 text-sm text-coffee/65">
            Enthält: {item.combo_items.map((ci) => `${ci.qty > 1 ? ci.qty + "× " : ""}${ci.name}`).join(", ")}
          </p>
        )}
        <p className="mt-1 font-bold text-terra">{euro(item.price)}</p>
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
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ categories: [], menus: [] }));
  }, []);

  if (!data) return null;
  const { categories = [], menus = [] } = data;
  if (categories.length === 0 && menus.length === 0) return null;

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
          {menus.length > 0 && (
            <div>
              <h3 className="mb-4 font-display text-xl font-bold text-terradark">🔥 Aktionen</h3>
              <ul className="space-y-3">
                {menus.map((item) => (
                  <MenuItem key={item.id} item={item} />
                ))}
              </ul>
            </div>
          )}
          {categories.map((section) => (
            <div key={section.title}>
              <h3 className="mb-4 font-display text-xl font-bold text-terradark">{section.title}</h3>
              <ul className="space-y-3">
                {section.items.map((item) => (
                  <MenuItem key={item.id} item={item} />
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
