import { NextResponse } from "next/server";
import { getSettings, priceCart, isOpenNow, insertOrder } from "../../../../lib/order";
import { notifyOwnerNewOrder, notifyCustomerOrderConfirmed } from "../../../../lib/notify";

/** Nakit (Barzahlung) siparişi */
export async function POST(request) {
  try {
    const { cart, orderType, customer } = await request.json();

    if (!customer?.name || !customer?.phone) {
      return NextResponse.json({ error: "Name und Telefonnummer sind erforderlich." }, { status: 400 });
    }
    if (orderType === "delivery" && !customer?.address) {
      return NextResponse.json({ error: "Lieferadresse erforderlich." }, { status: 400 });
    }

    const settings = await getSettings();
    if (!settings.cash_enabled) {
      return NextResponse.json({ error: "Barzahlung ist nicht verfügbar." }, { status: 400 });
    }
    if (orderType === "delivery" && !settings.delivery_enabled) {
      return NextResponse.json({ error: "Lieferung ist derzeit nicht verfügbar." }, { status: 400 });
    }
    if (orderType === "pickup" && !settings.pickup_enabled) {
      return NextResponse.json({ error: "Abholung ist derzeit nicht verfügbar." }, { status: 400 });
    }
    if (!isOpenNow()) {
      return NextResponse.json(
        { error: "Wir nehmen Bestellungen nur während der Öffnungszeiten entgegen." },
        { status: 409 }
      );
    }

    const pricing = await priceCart(cart, settings, orderType);
    if (pricing.error) return NextResponse.json({ error: pricing.error }, { status: 400 });

    const order = await insertOrder(customer, pricing, orderType, "cash");

    try { await notifyOwnerNewOrder(order, pricing); } catch (e) { console.error(e); }
    try { await notifyCustomerOrderConfirmed(order, pricing, pricing.prepMinutes); } catch (e) { console.error(e); }

    return NextResponse.json({
      confirmed: true,
      orderId: order.id,
      total: pricing.total,
      prepMinutes: pricing.prepMinutes,
    });
  } catch (e) {
    console.error("order create error:", e);
    return NextResponse.json({ error: "Bestellung fehlgeschlagen." }, { status: 500 });
  }
}
