import { NextResponse } from "next/server";
import { getSettings, priceCart, isOpenNow } from "../../../../../lib/order";
import { createPaypalOrder, paypalConfigured } from "../../../../../lib/paypal";
import siteData from "../../../../../data/site-data.json";

export async function POST(request) {
  try {
    const { cart, orderType } = await request.json();

    const settings = await getSettings();
    if (!paypalConfigured(settings)) {
      return NextResponse.json({ error: "PayPal ist nicht eingerichtet." }, { status: 400 });
    }
    if (!isOpenNow()) {
      return NextResponse.json(
        { error: "Wir nehmen Bestellungen nur während der Öffnungszeiten entgegen." },
        { status: 409 }
      );
    }

    const pricing = await priceCart(cart, settings, orderType);
    if (pricing.error) return NextResponse.json({ error: pricing.error }, { status: 400 });

    const ppOrder = await createPaypalOrder(settings, pricing.total, siteData.restaurant.name);
    return NextResponse.json({ paypalOrderId: ppOrder.id });
  } catch (e) {
    console.error("paypal create error:", e);
    return NextResponse.json({ error: "PayPal-Zahlung konnte nicht gestartet werden." }, { status: 500 });
  }
}
