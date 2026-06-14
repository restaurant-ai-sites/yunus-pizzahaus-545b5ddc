import { NextResponse } from "next/server";
import { sb, PROJECT_ID } from "../../../../lib/order";
import { isAdmin, unauthorized } from "../../../../lib/admin";

const VALID_STATUS = ["new", "confirmed", "preparing", "ready", "delivered", "cancelled"];

export async function GET(request) {
  if (!isAdmin(request)) return unauthorized();
  const date = new URL(request.url).searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date erforderlich" }, { status: 400 });

  const orders = await sb(
    `orders?project_id=eq.${PROJECT_ID}&created_at=gte.${date}T00:00:00&created_at=lte.${date}T23:59:59&order=created_at.desc&select=*`
  );
  const active = (orders || []).filter((o) => o.status !== "cancelled");
  const revenue = active.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  return NextResponse.json({ orders: orders || [], revenue, count: active.length });
}

export async function PATCH(request) {
  if (!isAdmin(request)) return unauthorized();
  try {
    const { id, status } = await request.json();
    if (!id || !VALID_STATUS.includes(status)) {
      return NextResponse.json({ error: "Ungültiger Status." }, { status: 400 });
    }
    await sb(`orders?id=eq.${id}&project_id=eq.${PROJECT_ID}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin orders error:", e);
    return NextResponse.json({ error: "Änderung fehlgeschlagen." }, { status: 500 });
  }
}
