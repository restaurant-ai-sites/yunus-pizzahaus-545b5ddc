import { NextResponse } from "next/server";
import { sb, PROJECT_ID } from "../../../../lib/order";
import { getAllMenuItems } from "../../../../lib/menu";
import { isAdmin, unauthorized } from "../../../../lib/admin";

export async function GET(request) {
  if (!isAdmin(request)) return unauthorized();
  const items = await getAllMenuItems();
  return NextResponse.json({ items });
}

export async function POST(request) {
  if (!isAdmin(request)) return unauthorized();
  try {
    const body = await request.json();
    if (!body.name || !(Number(body.price) >= 0)) {
      return NextResponse.json({ error: "Name und Preis sind erforderlich." }, { status: 400 });
    }
    const [item] = await sb("menu_items", {
      method: "POST",
      body: JSON.stringify({
        project_id: PROJECT_ID,
        category: body.category || (body.is_menu ? "Aktionen" : "Sonstiges"),
        name: body.name,
        description: body.description || "",
        price: Number(body.price),
        image_url: body.image_url || null,
        prep_minutes: Number(body.prep_minutes) || 0,
        is_menu: Boolean(body.is_menu),
        combo_items: Array.isArray(body.combo_items) ? body.combo_items : [],
        active: body.active !== false,
        sort_order: Number(body.sort_order) || 0,
      }),
    });
    return NextResponse.json({ item });
  } catch (e) {
    console.error("admin menu create error:", e);
    return NextResponse.json({ error: "Artikel konnte nicht angelegt werden." }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!isAdmin(request)) return unauthorized();
  try {
    const { id, ...fields } = await request.json();
    if (!id) return NextResponse.json({ error: "id erforderlich." }, { status: 400 });

    const update = {};
    if (fields.category !== undefined) update.category = fields.category;
    if (fields.name !== undefined) update.name = fields.name;
    if (fields.description !== undefined) update.description = fields.description;
    if (fields.price !== undefined) update.price = Number(fields.price);
    if (fields.image_url !== undefined) update.image_url = fields.image_url;
    if (fields.prep_minutes !== undefined) update.prep_minutes = Number(fields.prep_minutes) || 0;
    if (fields.combo_items !== undefined) update.combo_items = Array.isArray(fields.combo_items) ? fields.combo_items : [];
    if (fields.is_menu !== undefined) update.is_menu = Boolean(fields.is_menu);
    if (fields.active !== undefined) update.active = Boolean(fields.active);
    if (fields.sort_order !== undefined) update.sort_order = Number(fields.sort_order);

    await sb(`menu_items?id=eq.${id}&project_id=eq.${PROJECT_ID}`, {
      method: "PATCH",
      body: JSON.stringify(update),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin menu update error:", e);
    return NextResponse.json({ error: "Artikel konnte nicht aktualisiert werden." }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!isAdmin(request)) return unauthorized();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id erforderlich." }, { status: 400 });
  try {
    await sb(`menu_items?id=eq.${id}&project_id=eq.${PROJECT_ID}`, { method: "DELETE" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin menu delete error:", e);
    return NextResponse.json({ error: "Artikel konnte nicht gelöscht werden." }, { status: 500 });
  }
}
