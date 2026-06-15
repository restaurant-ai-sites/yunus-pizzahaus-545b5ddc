"use client";

import { useEffect, useRef, useState } from "react";
import { getCart, setQty, clearCart, parsePriceClient, euro } from "../lib/cart";
import siteData from "../data/site-data.json";

const inputCls =
  "w-full rounded-xl border border-coffee/20 bg-cream px-4 py-3 outline-none transition-colors focus:border-terra";

function pickupTime(prepMinutes) {
  return new Date(Date.now() + (prepMinutes || 0) * 60_000).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  });
}

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [orderType, setOrderType] = useState("pickup");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const paypalRef = useRef(null);
  const paypalRendered = useRef(false);

  useEffect(() => {
    const update = () => setCart(getCart());
    update();
    window.addEventListener("cart-updated", update);
    return () => window.removeEventListener("cart-updated", update);
  }, []);

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((d) => setMenuItems([...(d.menus || []), ...((d.categories || []).flatMap((c) => c.items))]))
      .catch(() => setMenuItems([]));
  }, []);

  useEffect(() => {
    fetch("/api/orders/settings")
      .then((r) => r.json())
      .then((s) => {
        setSettings(s);
        setOrderType(s.pickupEnabled ? "pickup" : "delivery");
        setPayment(s.paypalClientId ? "paypal" : s.cashEnabled ? "cash" : "");
      })
      .catch(() => setError("Einstellungen konnten nicht geladen werden."));
  }, []);

  const subtotal = cart.reduce((sum, i) => sum + parsePriceClient(i.price) * i.qty, 0);
  const cartPrepMinutes =
    cart.reduce((max, ci) => {
      const item = menuItems.find((m) => m.name === ci.name);
      return Math.max(max, Number(item?.prep_minutes) || 0);
    }, 0) || settings?.prepTimeMinutes || 30;
  const deliveryFee = orderType === "delivery" ? (settings?.deliveryFee || 0) : 0;
  const total = subtotal + deliveryFee;
  const formValid = name && phone && (orderType !== "delivery" || address);

  // PayPal butonlarını yükle/yenile
  useEffect(() => {
    if (payment !== "paypal" || !settings?.paypalClientId || !formValid || cart.length === 0) {
      paypalRendered.current = false;
      if (paypalRef.current) paypalRef.current.innerHTML = "";
      return;
    }
    if (paypalRendered.current) return;

    const customer = { name, phone, email, address };
    const renderButtons = () => {
      if (!window.paypal || !paypalRef.current) return;
      paypalRef.current.innerHTML = "";
      window.paypal
        .Buttons({
          createOrder: async () => {
            const res = await fetch("/api/orders/paypal/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cart, orderType }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data.paypalOrderId;
          },
          onApprove: async (data) => {
            const res = await fetch("/api/orders/paypal/capture", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paypalOrderId: data.orderID, cart, orderType, customer }),
            });
            const result = await res.json();
            if (!res.ok) { setError(result.error); return; }
            clearCart();
            setConfirmation(result);
          },
          onError: () => setError("PayPal-Zahlung fehlgeschlagen. Bitte erneut versuchen."),
        })
        .render(paypalRef.current);
      paypalRendered.current = true;
    };

    if (window.paypal) { renderButtons(); return; }
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${settings.paypalClientId}&currency=EUR&intent=capture`;
    script.onload = renderButtons;
    document.body.appendChild(script);
  }, [payment, settings, formValid, cart, orderType, name, phone, email, address]);

  async function submitCash(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart, orderType, customer: { name, phone, email, address } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      clearCart();
      setConfirmation(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (confirmation) {
    return (
      <div className="mt-10 rounded-3xl bg-sand/70 p-10 text-center">
        <p className="text-6xl">🎉</p>
        <h2 className="mt-4 font-display text-3xl font-extrabold">Bestellung eingegangen!</h2>
        <p className="mt-3 text-coffee/75">
          Gesamtbetrag: <strong>{euro(confirmation.total)}</strong>
          <br />
          Fertig in ca. <strong>{confirmation.prepMinutes} Minuten</strong>.
        </p>
        <a href="/" className="mt-8 inline-block rounded-full bg-terra px-8 py-3 font-bold text-white">
          Zurück zur Startseite
        </a>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="mt-10 text-center">
        <p className="text-coffee/60">Dein Warenkorb ist leer.</p>
        <a href="/#speisekarte" className="mt-4 inline-block rounded-full bg-terra px-8 py-3 font-bold text-white">
          Zur Speisekarte
        </a>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-8">
      {settings && !settings.openNow && (
        <p className="rounded-2xl bg-amber-100 p-4 text-center text-sm text-amber-900">
          ⏰ Wir sind aktuell geschlossen — Bestellungen sind nur während der Öffnungszeiten möglich.
        </p>
      )}

      {/* Sepet */}
      <ul className="space-y-3">
        {cart.map((item) => (
          <li key={item.name} className="flex items-center justify-between gap-3 rounded-2xl bg-sand/60 p-4">
            <div className="min-w-0">
              <p className="font-display font-semibold">{item.name}</p>
              <p className="text-sm text-coffee/60">{item.price}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setQty(item.name, item.qty - 1)}
                className="h-8 w-8 rounded-full bg-cream font-bold shadow-sm">−</button>
              <span className="w-6 text-center font-bold">{item.qty}</span>
              <button onClick={() => setQty(item.name, item.qty + 1)}
                className="h-8 w-8 rounded-full bg-terra font-bold text-white">+</button>
            </div>
          </li>
        ))}
      </ul>

      {/* Teslimat tipi */}
      {settings && (
        <div className="grid grid-cols-2 gap-3">
          {settings.pickupEnabled && (
            <button onClick={() => setOrderType("pickup")}
              className={`rounded-2xl border-2 p-4 font-display font-bold transition-colors ${
                orderType === "pickup" ? "border-terra bg-terra/10" : "border-coffee/15"}`}>
              🏃 Abholung
            </button>
          )}
          {settings.deliveryEnabled && (
            <button onClick={() => setOrderType("delivery")}
              className={`rounded-2xl border-2 p-4 font-display font-bold transition-colors ${
                orderType === "delivery" ? "border-terra bg-terra/10" : "border-coffee/15"}`}>
              🚗 Lieferung {settings.deliveryFee > 0 && <span className="block text-xs font-normal">+{euro(settings.deliveryFee)}</span>}
            </button>
          )}
        </div>
      )}

      {/* Müşteri bilgileri */}
      <div className="space-y-4">
        <input placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        <div className="grid gap-4 sm:grid-cols-2">
          <input placeholder="Telefon *" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
          <input placeholder="E-Mail (für Bestätigung)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </div>
        {orderType === "delivery" && (
          <input placeholder="Lieferadresse *" value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
        )}
      </div>

      {/* Abholung-Hinweis */}
      {orderType === "pickup" && settings && (
        <p className="rounded-2xl bg-sand/60 p-4 text-center text-sm text-coffee/75">
          📍 Du kannst deine Bestellung um <strong>{pickupTime(cartPrepMinutes)} Uhr</strong> bei{" "}
          <strong>{siteData.restaurant.address || siteData.restaurant.name}</strong> abholen.
        </p>
      )}

      {/* Toplam */}
      <div className="rounded-2xl bg-sand/60 p-5 text-sm">
        <div className="flex justify-between"><span>Zwischensumme</span><span>{euro(subtotal)}</span></div>
        {deliveryFee > 0 && (
          <div className="mt-1 flex justify-between"><span>Liefergebühr</span><span>{euro(deliveryFee)}</span></div>
        )}
        <div className="mt-2 flex justify-between border-t border-coffee/15 pt-2 font-display text-lg font-extrabold">
          <span>Gesamt</span><span>{euro(total)}</span>
        </div>
        {settings && orderType === "delivery" && subtotal < settings.minOrderValue && (
          <p className="mt-2 text-xs text-red-700">
            Mindestbestellwert für Lieferung: {euro(settings.minOrderValue)}
          </p>
        )}
      </div>

      {/* Ödeme */}
      {settings && (
        <div className="space-y-4">
          <div className="flex gap-3">
            {settings.paypalClientId && (
              <button onClick={() => setPayment("paypal")}
                className={`flex-1 rounded-2xl border-2 p-3 font-bold transition-colors ${
                  payment === "paypal" ? "border-terra bg-terra/10" : "border-coffee/15"}`}>
                💳 PayPal
              </button>
            )}
            {settings.cashEnabled && (
              <button onClick={() => setPayment("cash")}
                className={`flex-1 rounded-2xl border-2 p-3 font-bold transition-colors ${
                  payment === "cash" ? "border-terra bg-terra/10" : "border-coffee/15"}`}>
                💶 Barzahlung
              </button>
            )}
          </div>

          {error && <p className="text-center text-sm text-red-700">{error}</p>}

          {payment === "cash" && (
            <button onClick={submitCash} disabled={loading || !formValid || !settings.openNow}
              className="w-full rounded-full bg-terra py-4 font-display font-bold text-white transition-colors hover:bg-terradark disabled:opacity-40">
              {loading ? "Wird gesendet…" : `Jetzt bestellen (bar zahlen) — ${euro(total)}`}
            </button>
          )}

          {payment === "paypal" && (
            <>
              {!formValid && (
                <p className="text-center text-sm text-coffee/60">
                  Bitte erst Name und Telefon{orderType === "delivery" ? " und Adresse" : ""} ausfüllen.
                </p>
              )}
              <div ref={paypalRef} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
