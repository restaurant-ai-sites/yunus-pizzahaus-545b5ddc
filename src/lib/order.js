/**
 * Sipariş motoru (sunucu tarafı).
 * Fiyatlar HER ZAMAN sunucudaki menüden hesaplanır — istemciden gelen
 * tutarlara asla güvenilmez.
 */

import siteData from "../data/site-data.json";
import { getActiveMenuItems, itemMap } from "./menu";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SECRET_KEY;
export const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID;

export async function sb(path, init = {}) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const DEFAULT_SETTINGS = {
  pickup_enabled: true,
  delivery_enabled: false,
  cash_enabled: true,
  delivery_fee: 0,
  min_order_value: 0,
  prep_time_minutes: 30,
  paypal_client_id: "",
  paypal_secret: "",
  paypal_sandbox: false,
};

export async function getSettings() {
  const rows = await sb(`ordering_settings?project_id=eq.${PROJECT_ID}`);
  return rows?.[0] ? { ...DEFAULT_SETTINGS, ...rows[0] } : { ...DEFAULT_SETTINGS, project_id: PROJECT_ID };
}

/** Sepeti sunucu fiyatlarıyla doğrular ve toplamı hesaplar */
export async function priceCart(cartItems, settings, orderType) {
  const items = await getActiveMenuItems();
  const products = itemMap(items);
  const lines = [];
  let subtotal = 0;
  let prepMinutes = 0;

  for (const item of cartItems || []) {
    const qty = Math.max(1, Math.min(50, parseInt(item.qty) || 1));
    const product = products[item.name];
    if (product === undefined) {
      return { error: `Artikel nicht gefunden: ${item.name}` };
    }
    const unit = product.price;
    lines.push({ name: item.name, qty, unit_price: unit, line_total: +(unit * qty).toFixed(2) });
    subtotal += unit * qty;
    prepMinutes = Math.max(prepMinutes, product.prep_minutes);
  }
  if (lines.length === 0) return { error: "Der Warenkorb ist leer." };
  if (prepMinutes <= 0) prepMinutes = Number(settings.prep_time_minutes) || 0;

  subtotal = +subtotal.toFixed(2);
  const deliveryFee = orderType === "delivery" ? +Number(settings.delivery_fee || 0).toFixed(2) : 0;
  const total = +(subtotal + deliveryFee).toFixed(2);

  if (orderType === "delivery" && subtotal < Number(settings.min_order_value || 0)) {
    return { error: `Mindestbestellwert für Lieferung: ${Number(settings.min_order_value).toFixed(2).replace(".", ",")} €` };
  }
  return { lines, subtotal, deliveryFee, total, prepMinutes };
}

const DAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

/** Şu an (Berlin saati) restoran açık mı? */
export function isOpenNow() {
  const fmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Berlin",
    hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short",
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value || "";
  const dayIdx = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Berlin" })
  ).getDay();
  const hours = (siteData.restaurant.openingHours || {})[DAY_NAMES[dayIdx]];
  if (!hours) return false;
  const m = String(hours).match(/(\d{1,2})[:.](\d{2})\s*[–\-]\s*(\d{1,2})[:.](\d{2})/);
  if (!m) return false;
  const now = parseInt(get("hour")) * 60 + parseInt(get("minute"));
  return now >= +m[1] * 60 + +m[2] && now <= +m[3] * 60 + +m[4];
}

/** Siparişi veritabanına yazar */
export async function insertOrder(customer, pricing, orderType, paymentStatus, paypalOrderId = null) {
  const rows = await sb("orders", {
    method: "POST",
    body: JSON.stringify({
      project_id: PROJECT_ID,
      customer_name: customer.name,
      customer_email: customer.email || null,
      customer_phone: customer.phone || null,
      delivery_address: orderType === "delivery" ? customer.address : null,
      order_type: orderType,
      items: pricing.lines,
      total_amount: pricing.total,
      prep_minutes: pricing.prepMinutes,
      currency: "EUR",
      payment_status: paymentStatus,
      paypal_order_id: paypalOrderId,
      status: "new",
    }),
  });
  return rows[0];
}
