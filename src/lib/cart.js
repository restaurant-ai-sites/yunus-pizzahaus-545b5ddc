"use client";

/** Sepet — localStorage'da tutulur; fiyat doğrulaması her zaman sunucuda yapılır. */

const KEY = "cart_v1";

export function getCart() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function save(cart) {
  localStorage.setItem(KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
}

export function addToCart(name, price) {
  const cart = getCart();
  const existing = cart.find((i) => i.name === name);
  if (existing) existing.qty += 1;
  else cart.push({ name, price, qty: 1 });
  save(cart);
}

export function setQty(name, qty) {
  let cart = getCart();
  if (qty <= 0) cart = cart.filter((i) => i.name !== name);
  else cart = cart.map((i) => (i.name === name ? { ...i, qty } : i));
  save(cart);
}

export function clearCart() {
  save([]);
}

export function cartCount() {
  return getCart().reduce((n, i) => n + i.qty, 0);
}

export function parsePriceClient(str) {
  const m = String(str).replace(",", ".").match(/(\d+(?:\.\d{1,2})?)/);
  return m ? parseFloat(m[1]) : 0;
}

export function cartSubtotal() {
  return getCart().reduce((sum, i) => sum + parsePriceClient(i.price) * i.qty, 0);
}

export function euro(n) {
  return n.toFixed(2).replace(".", ",") + " €";
}
