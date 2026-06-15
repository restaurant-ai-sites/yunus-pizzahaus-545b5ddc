/** Speisekarte/Menü-Verwaltung — Produkte und "Menüs" (Kombo-Pakete) aus Supabase. */

import { sb, PROJECT_ID } from "./order";

/** Nur aktive Artikel, für Website + Preisberechnung */
export async function getActiveMenuItems() {
  return (
    (await sb(
      `menu_items?project_id=eq.${PROJECT_ID}&active=eq.true&order=sort_order.asc,created_at.asc`
    )) || []
  );
}

/** Alle Artikel (inkl. inaktiv), für Admin-Verwaltung */
export async function getAllMenuItems() {
  return (
    (await sb(`menu_items?project_id=eq.${PROJECT_ID}&order=sort_order.asc,created_at.asc`)) || []
  );
}

/** { "Pizza Salami": 11.0, ... } — für Preisvalidierung im Bestellprozess */
export function priceMap(items) {
  const prices = {};
  for (const item of items) prices[item.name] = Number(item.price);
  return prices;
}

/** { "Pizza Salami": { price, prep_minutes }, ... } — für Preis- und Zeitberechnung */
export function itemMap(items) {
  const map = {};
  for (const item of items) {
    map[item.name] = { price: Number(item.price), prep_minutes: Number(item.prep_minutes) || 0 };
  }
  return map;
}
