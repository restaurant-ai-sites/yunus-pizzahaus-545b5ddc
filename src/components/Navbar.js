"use client";

import { useEffect, useState } from "react";
import siteData from "../data/site-data.json";
import { cartCount } from "../lib/cart";

const links = [
  { href: "/#speisekarte", label: "Speisekarte" },
  { href: "/#kontakt", label: "Kontakt" },
];

export default function Navbar() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(cartCount());
    update();
    window.addEventListener("cart-updated", update);
    return () => window.removeEventListener("cart-updated", update);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-coffee/10 bg-cream/95 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <a href="/" className="font-display text-xl font-bold tracking-tight">
          {siteData.restaurant.name}
        </a>
        <ul className="flex items-center gap-4 text-sm sm:gap-7">
          {links.map((link) => (
            <li key={link.href} className="hidden sm:block">
              <a href={link.href} className="hover:text-terra transition-colors">
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href="/bestellen"
              className="flex items-center gap-2 rounded-full bg-terra px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-terradark"
            >
              🛒 Warenkorb
              {count > 0 && (
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-terra">
                  {count}
                </span>
              )}
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
