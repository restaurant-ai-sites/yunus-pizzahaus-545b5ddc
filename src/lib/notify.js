/** Sipariş bildirimleri — sahibine yeni sipariş, müşteriye onay (Resend). */

import siteData from "../data/site-data.json";

function formatLines(lines) {
  return lines
    .map((l) => `<tr><td>${l.qty}×</td><td style="padding:0 12px">${l.name}</td><td align="right">${l.line_total.toFixed(2).replace(".", ",")} €</td></tr>`)
    .join("");
}

async function sendEmail(to, subject, html) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${siteData.restaurant.name} <${process.env.RESEND_FROM_EMAIL}>`,
      to, subject, html,
    }),
  });
  if (!res.ok) throw new Error(`E-Mail fehlgeschlagen: ${await res.text()}`);
}

export async function notifyOwnerNewOrder(order, pricing) {
  const ownerEmail = siteData.restaurant.email;
  if (!ownerEmail) return;
  const typeLabel = order.order_type === "delivery" ? "🚗 Lieferung" : "🏃 Abholung";
  await sendEmail(
    ownerEmail,
    `🔔 Neue Bestellung — ${pricing.total.toFixed(2).replace(".", ",")} € (${typeLabel})`,
    `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
      <h2>Neue Online-Bestellung</h2>
      <p><strong>${typeLabel}</strong> · ${order.payment_status === "paid" ? "✅ Online bezahlt (PayPal)" : "💶 Barzahlung"}</p>
      <p><strong>Kunde:</strong> ${order.customer_name}<br>
      ${order.customer_phone ? `<strong>Telefon:</strong> ${order.customer_phone}<br>` : ""}
      ${order.delivery_address ? `<strong>Adresse:</strong> ${order.delivery_address}<br>` : ""}</p>
      <table style="width:100%;border-collapse:collapse">${formatLines(pricing.lines)}</table>
      <hr>
      <p align="right"><strong>Gesamt: ${pricing.total.toFixed(2).replace(".", ",")} €</strong>
      ${pricing.deliveryFee ? `<br><small>inkl. ${pricing.deliveryFee.toFixed(2).replace(".", ",")} € Liefergebühr</small>` : ""}</p>
      <p>Verwalten Sie die Bestellung im Admin-Bereich Ihrer Website (/admin).</p>
    </div>`
  );
}

export async function notifyCustomerOrderConfirmed(order, pricing, prepMinutes) {
  if (!order.customer_email) return;
  const typeLabel = order.order_type === "delivery" ? "geliefert" : "zur Abholung bereit";
  await sendEmail(
    order.customer_email,
    `Bestellbestätigung — ${siteData.restaurant.name}`,
    `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
      <h2>${siteData.restaurant.name}</h2>
      <p>Vielen Dank für Ihre Bestellung, ${order.customer_name}!</p>
      <table style="width:100%;border-collapse:collapse">${formatLines(pricing.lines)}</table>
      <hr>
      <p align="right"><strong>Gesamt: ${pricing.total.toFixed(2).replace(".", ",")} €</strong></p>
      <p>${order.payment_status === "paid" ? "Ihre Zahlung ist eingegangen (PayPal)." : "Bitte zahlen Sie bar bei " + (order.order_type === "delivery" ? "Lieferung" : "Abholung") + "."}</p>
      <p>Ihre Bestellung wird in ca. <strong>${prepMinutes} Minuten</strong> ${typeLabel}.</p>
      <p><strong>${siteData.restaurant.name}</strong><br>
      ${siteData.restaurant.address || ""}<br>
      ${siteData.restaurant.phone || ""}</p>
    </div>`
  );
}
