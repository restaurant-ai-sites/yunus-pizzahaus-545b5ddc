import { NextResponse } from "next/server";
import { sb, PROJECT_ID, getSettings } from "../../../../lib/order";
import { isAdmin, unauthorized } from "../../../../lib/admin";

export async function GET(request) {
  if (!isAdmin(request)) return unauthorized();
  const s = await getSettings();
  // Secret asla geri gönderilmez — sadece girilmiş mi bilgisi
  const { paypal_secret, ...safe } = s;
  return NextResponse.json({ settings: { ...safe, has_paypal_secret: Boolean(paypal_secret) } });
}

export async function PUT(request) {
  if (!isAdmin(request)) return unauthorized();
  try {
    const body = await request.json();
    const current = await getSettings();

    const settings = {
      project_id: PROJECT_ID,
      pickup_enabled: Boolean(body.pickup_enabled),
      delivery_enabled: Boolean(body.delivery_enabled),
      cash_enabled: Boolean(body.cash_enabled),
      delivery_fee: Math.max(0, Number(body.delivery_fee) || 0),
      min_order_value: Math.max(0, Number(body.min_order_value) || 0),
      prep_time_minutes: Math.max(5, Number(body.prep_time_minutes) || 30),
      paypal_client_id: (body.paypal_client_id ?? current.paypal_client_id ?? "").trim(),
      // Secret yalnızca yeni değer girildiyse güncellenir (boş bırakılırsa korunur)
      paypal_secret: body.paypal_secret ? String(body.paypal_secret).trim() : (current.paypal_secret || ""),
      paypal_sandbox: Boolean(body.paypal_sandbox),
      updated_at: new Date().toISOString(),
    };

    await sb("ordering_settings", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(settings),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("ordering settings error:", e);
    return NextResponse.json({ error: "Einstellungen konnten nicht gespeichert werden." }, { status: 500 });
  }
}
