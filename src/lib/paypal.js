/** PayPal REST entegrasyonu — restoran sahibinin kendi hesabıyla çalışır.
 *  Client ID + Secret admin panelden girilir (ordering_settings). */

function apiBase(settings) {
  return settings.paypal_sandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

export function paypalConfigured(settings) {
  return Boolean(settings.paypal_client_id && settings.paypal_secret);
}

async function getAccessToken(settings) {
  const auth = Buffer.from(`${settings.paypal_client_id}:${settings.paypal_secret}`).toString("base64");
  const res = await fetch(`${apiBase(settings)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth fehlgeschlagen: ${await res.text()}`);
  return (await res.json()).access_token;
}

export async function createPaypalOrder(settings, total, restaurantName) {
  const token = await getAccessToken(settings);
  const res = await fetch(`${apiBase(settings)}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        amount: { currency_code: "EUR", value: total.toFixed(2) },
        description: `Online-Bestellung — ${restaurantName}`,
      }],
    }),
  });
  if (!res.ok) throw new Error(`PayPal Order fehlgeschlagen: ${await res.text()}`);
  return await res.json();
}

export async function capturePaypalOrder(settings, paypalOrderId) {
  const token = await getAccessToken(settings);
  const res = await fetch(`${apiBase(settings)}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`PayPal Capture fehlgeschlagen: ${await res.text()}`);
  const data = await res.json();
  return data.status === "COMPLETED";
}
