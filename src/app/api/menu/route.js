import { NextResponse } from "next/server";
import { getActiveMenuItems } from "../../../lib/menu";

// Diese Route muss bei jedem Aufruf aktuell sein (Speisekarte wird im Admin gepflegt)
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await getActiveMenuItems();
    const menus = items.filter((i) => i.is_menu);
    const categories = [];
    for (const item of items.filter((i) => !i.is_menu)) {
      let cat = categories.find((c) => c.title === item.category);
      if (!cat) {
        cat = { title: item.category, items: [] };
        categories.push(cat);
      }
      cat.items.push(item);
    }
    return NextResponse.json({ categories, menus });
  } catch (e) {
    console.error("menu error:", e);
    return NextResponse.json({ error: "Speisekarte nicht verfügbar." }, { status: 500 });
  }
}
