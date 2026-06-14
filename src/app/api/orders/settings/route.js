import { NextResponse } from "next/server";
import { getSettings, isOpenNow } from "../../../../lib/order";
import { paypalConfigured } from "../../../../lib/paypal";

// Bu route her istekte çalışmalı (build sırasında statik üretilmemeli)
export const dynamic = "force-dynamic";

/** Müşteriye açık ayarlar — secret asla dönülmez */
export async function GET() {
  try {
    const s = await getSettings();
    return NextResponse.json({
      pickupEnabled: s.pickup_enabled,
      deliveryEnabled: s.delivery_enabled,
      cashEnabled: s.cash_enabled,
      deliveryFee: Number(s.delivery_fee || 0),
      minOrderValue: Number(s.min_order_value || 0),
      prepTimeMinutes: s.prep_time_minutes,
      paypalClientId: paypalConfigured(s) ? s.paypal_client_id : "",
      paypalSandbox: Boolean(s.paypal_sandbox),
      openNow: isOpenNow(),
    });
  } catch (e) {
    console.error("order settings error:", e);
    return NextResponse.json({ error: "Einstellungen nicht verfügbar." }, { status: 500 });
  }
}
