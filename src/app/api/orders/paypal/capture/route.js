import { NextResponse } from "next/server";
import { getSettings, priceCart, insertOrder } from "../../../../../lib/order";
import { capturePaypalOrder } from "../../../../../lib/paypal";
import { notifyOwnerNewOrder, notifyCustomerOrderConfirmed } from "../../../../../lib/notify";

export async function POST(request) {
  try {
    const { paypalOrderId, cart, orderType, customer } = await request.json();
    if (!paypalOrderId || !customer?.name) {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }

    const settings = await getSettings();
    const pricing = await priceCart(cart, settings, orderType);
    if (pricing.error) return NextResponse.json({ error: pricing.error }, { status: 400 });

    const captured = await capturePaypalOrder(settings, paypalOrderId);
    if (!captured) {
      return NextResponse.json({ error: "Zahlung wurde nicht abgeschlossen." }, { status: 402 });
    }

    const order = await insertOrder(customer, pricing, orderType, "paid", paypalOrderId);

    try { await notifyOwnerNewOrder(order, pricing); } catch (e) { console.error(e); }
    try { await notifyCustomerOrderConfirmed(order, pricing, pricing.prepMinutes); } catch (e) { console.error(e); }

    return NextResponse.json({
      confirmed: true,
      orderId: order.id,
      total: pricing.total,
      prepMinutes: pricing.prepMinutes,
    });
  } catch (e) {
    console.error("paypal capture error:", e);
    return NextResponse.json({ error: "Zahlung fehlgeschlagen." }, { status: 500 });
  }
}
