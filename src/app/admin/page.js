"use client";

import { useEffect, useState, useCallback } from "react";

const inputCls =
  "w-full rounded-xl border border-coffee/20 bg-cream px-3 py-2 outline-none focus:border-terra";
const btnCls =
  "rounded-full bg-terra px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-terradark disabled:opacity-40";

const STATUS_LABELS = {
  new: "🆕 Neu",
  confirmed: "✅ Bestätigt",
  preparing: "👨‍🍳 In Zubereitung",
  ready: "📦 Fertig",
  delivered: "🚗 Geliefert/Abgeholt",
  cancelled: "❌ Storniert",
};

function api(path, key, init = {}) {
  return fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", "x-admin-key": key, ...(init.headers || {}) },
  }).then(async (r) => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Fehler");
    return data;
  });
}

function euro(n) {
  return Number(n).toFixed(2).replace(".", ",") + " €";
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState("bestellungen");
  const [error, setError] = useState("");

  async function login(e) {
    e.preventDefault();
    setError("");
    const key = adminKey.trim();
    try {
      await api("/api/admin/settings", key);
      sessionStorage.setItem("adminKey", key);
      setAdminKey(key);
      setAuthed(true);
    } catch {
      setError("Falsches Passwort.");
    }
  }

  useEffect(() => {
    const saved = sessionStorage.getItem("adminKey");
    if (saved) {
      api("/api/admin/settings", saved)
        .then(() => { setAdminKey(saved); setAuthed(true); })
        .catch(() => sessionStorage.removeItem("adminKey"));
    }
  }, []);

  if (!authed) {
    return (
      <main className="mx-auto max-w-sm px-4 py-24">
        <h1 className="text-center font-display text-3xl font-extrabold">Admin-Bereich</h1>
        <form onSubmit={login} className="mt-8 space-y-4">
          <input type="password" placeholder="Admin-Passwort" value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)} className={inputCls} autoFocus />
          {error && <p className="text-center text-sm text-red-700">{error}</p>}
          <button className={`${btnCls} w-full`}>Anmelden</button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">Admin-Bereich</h1>
      <div className="mt-6 flex gap-2 border-b border-coffee/15">
        {[["bestellungen", "📋 Bestellungen"], ["speisekarte", "🍕 Speisekarte"], ["einstellungen", "⚙️ Einstellungen"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm ${tab === id ? "border-b-2 border-terra font-bold" : "text-coffee/60"}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === "bestellungen" && <OrdersTab adminKey={adminKey} />}
      {tab === "speisekarte" && <MenuTab adminKey={adminKey} />}
      {tab === "einstellungen" && <SettingsTab adminKey={adminKey} />}
    </main>
  );
}

function OrdersTab({ adminKey }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(
    () => api(`/api/admin/orders?date=${date}`, adminKey).then(setData).catch((e) => setMsg(e.message)),
    [adminKey, date]
  );
  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000); // 30 sn'de bir yenile
    return () => clearInterval(interval);
  }, [load]);

  async function setStatus(id, status) {
    try {
      await api("/api/admin/orders", adminKey, {
        method: "PATCH",
        body: JSON.stringify({ id, status }),
      });
      load();
    } catch (e) { setMsg(e.message); }
  }

  async function setOrderType(id, order_type) {
    try {
      await api("/api/admin/orders", adminKey, {
        method: "PATCH",
        body: JSON.stringify({ id, order_type }),
      });
      load();
    } catch (e) { setMsg(e.message); }
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-4">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className={`${inputCls} max-w-xs`} />
        {data && (
          <p className="text-sm text-coffee/70">
            <strong>{data.count}</strong> Bestellung(en) · Umsatz: <strong>{euro(data.revenue)}</strong>
          </p>
        )}
      </div>
      {msg && <p className="mt-3 text-sm text-red-700">{msg}</p>}

      <div className="mt-6 space-y-4">
        {data?.orders?.map((o) => (
          <div key={o.id}
            className={`rounded-2xl border p-5 ${o.status === "new" ? "border-terra bg-terra/5" : "border-coffee/10"} ${o.status === "cancelled" ? "opacity-50" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display font-bold">
                  {new Date(o.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}{" "}
                  · {o.customer_name}
                </p>
                <p className="mt-1">
                  <select value={o.order_type} onChange={(e) => setOrderType(o.id, e.target.value)}
                    className="rounded-lg border border-coffee/20 bg-cream px-2 py-1 text-sm">
                    <option value="delivery">🚗 Lieferung</option>
                    <option value="pickup">🏃 Abholung</option>
                  </select>
                </p>
                <p className="text-sm text-coffee/65">
                  📞 {o.customer_phone || "—"}
                  {o.delivery_address && <> · 📍 {o.delivery_address}</>}
                </p>
                <p className="mt-1 text-sm">
                  {o.payment_status === "paid" ? "✅ PayPal bezahlt" : "💶 Barzahlung"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-xl font-extrabold">{euro(o.total_amount)}</p>
                <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}
                  className="mt-2 rounded-lg border border-coffee/20 bg-cream px-2 py-1 text-sm">
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
            <ul className="mt-3 border-t border-coffee/10 pt-3 text-sm">
              {(o.items || []).map((item, i) => (
                <li key={i} className="flex justify-between">
                  <span>{item.qty}× {item.name}</span>
                  <span>{euro(item.line_total)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {data?.orders?.length === 0 && (
          <p className="py-8 text-center text-coffee/50">Keine Bestellungen an diesem Tag.</p>
        )}
      </div>
    </div>
  );
}

function SettingsTab({ adminKey }) {
  const [s, setS] = useState(null);
  const [newSecret, setNewSecret] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api("/api/admin/settings", adminKey).then((d) => setS(d.settings));
  }, [adminKey]);

  if (!s) return <p className="mt-8 text-coffee/60">Lädt…</p>;

  async function save(e) {
    e.preventDefault();
    setMsg("");
    try {
      await api("/api/admin/settings", adminKey, {
        method: "PUT",
        body: JSON.stringify({ ...s, paypal_secret: newSecret }),
      });
      setMsg("✓ Gespeichert");
      setNewSecret("");
      if (newSecret) setS({ ...s, has_paypal_secret: true });
    } catch (err) { setMsg(err.message); }
  }

  return (
    <form onSubmit={save} className="mt-8 max-w-md space-y-5">
      <div className="space-y-2">
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={s.pickup_enabled}
            onChange={(e) => setS({ ...s, pickup_enabled: e.target.checked })} />
          <span>🏃 Abholung anbieten</span>
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={s.delivery_enabled}
            onChange={(e) => setS({ ...s, delivery_enabled: e.target.checked })} />
          <span>🚗 Lieferung anbieten</span>
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={s.cash_enabled}
            onChange={(e) => setS({ ...s, cash_enabled: e.target.checked })} />
          <span>💶 Barzahlung erlauben</span>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm text-coffee/70">Liefergebühr (€)</span>
          <input type="number" step="0.5" min="0" value={s.delivery_fee} className={inputCls}
            onChange={(e) => setS({ ...s, delivery_fee: e.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-coffee/70">Mindestbestellwert (€)</span>
          <input type="number" step="0.5" min="0" value={s.min_order_value} className={inputCls}
            onChange={(e) => setS({ ...s, min_order_value: e.target.value })} />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm text-coffee/70">Zubereitungszeit (Minuten)</span>
        <input type="number" min="5" step="5" value={s.prep_time_minutes} className={inputCls}
          onChange={(e) => setS({ ...s, prep_time_minutes: e.target.value })} />
      </label>

      <div className="rounded-2xl bg-sand/60 p-5">
        <h3 className="font-display font-bold">💳 PayPal (Online-Zahlung)</h3>
        <p className="mt-1 text-xs text-coffee/60">
          developer.paypal.com → Apps & Credentials → Live → Client-ID und Secret hier eintragen.
        </p>
        <label className="mt-4 block">
          <span className="mb-1 block text-sm text-coffee/70">PayPal Client-ID</span>
          <input value={s.paypal_client_id || ""} className={inputCls}
            onChange={(e) => setS({ ...s, paypal_client_id: e.target.value })} />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-sm text-coffee/70">
            PayPal Secret {s.has_paypal_secret && "(gespeichert — nur bei Änderung ausfüllen)"}
          </span>
          <input type="password" value={newSecret} placeholder={s.has_paypal_secret ? "••••••••" : ""}
            className={inputCls} onChange={(e) => setNewSecret(e.target.value)} />
        </label>
        <label className="mt-3 flex items-center gap-3">
          <input type="checkbox" checked={s.paypal_sandbox}
            onChange={(e) => setS({ ...s, paypal_sandbox: e.target.checked })} />
          <span className="text-sm">Sandbox-Modus (nur zum Testen)</span>
        </label>
      </div>

      <div className="flex items-center gap-4">
        <button className={btnCls}>Speichern</button>
        {msg && <span className="text-sm">{msg}</span>}
      </div>
    </form>
  );
}

const emptyMenuForm = { name: "", description: "", price: "", category: "", image_url: "", is_menu: false, prep_minutes: "", combo_items: [] };

function MenuTab({ adminKey }) {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(emptyMenuForm);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(
    () => api("/api/admin/menu", adminKey).then((d) => setItems(d.items)).catch((e) => setMsg(e.message)),
    [adminKey]
  );
  useEffect(() => { load(); }, [load]);

  async function uploadImage(file) {
    setUploading(true);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/menu/upload", {
        method: "POST",
        headers: { "x-admin-key": adminKey },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm((f) => ({ ...f, image_url: data.url }));
    } catch (e) { setMsg(e.message); }
    finally { setUploading(false); }
  }

  async function save(e) {
    e.preventDefault();
    setMsg("");
    if (!form.name || form.price === "") { setMsg("Name und Preis sind erforderlich."); return; }
    if (form.is_menu && form.combo_items.length === 0) { setMsg("Bitte mindestens einen Artikel für die Aktion auswählen."); return; }

    const payload = { ...form };
    if (form.is_menu) {
      const maxPrep = form.combo_items.reduce((max, ci) => {
        const src = items.find((i) => i.id === ci.id);
        return Math.max(max, Number(src?.prep_minutes) || 0);
      }, 0);
      payload.prep_minutes = maxPrep;
    }

    try {
      if (editingId) {
        await api("/api/admin/menu", adminKey, { method: "PATCH", body: JSON.stringify({ id: editingId, ...payload }) });
      } else {
        await api("/api/admin/menu", adminKey, { method: "POST", body: JSON.stringify(payload) });
      }
      setForm(emptyMenuForm);
      setEditingId(null);
      load();
    } catch (e) { setMsg(e.message); }
  }

  function edit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description || "",
      price: item.price,
      category: item.category || "",
      image_url: item.image_url || "",
      is_menu: item.is_menu,
      prep_minutes: item.prep_minutes || "",
      combo_items: item.combo_items || [],
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyMenuForm);
  }

  function toggleComboItem(comboItem) {
    setForm((f) => {
      const exists = f.combo_items.some((ci) => ci.id === comboItem.id);
      if (exists) {
        return { ...f, combo_items: f.combo_items.filter((ci) => ci.id !== comboItem.id) };
      }
      return { ...f, combo_items: [...f.combo_items, { id: comboItem.id, name: comboItem.name, qty: 1 }] };
    });
  }

  function setComboQty(id, qty) {
    setForm((f) => ({
      ...f,
      combo_items: f.combo_items.map((ci) => (ci.id === id ? { ...ci, qty: Math.max(1, Number(qty) || 1) } : ci)),
    }));
  }

  async function toggleActive(item) {
    await api("/api/admin/menu", adminKey, { method: "PATCH", body: JSON.stringify({ id: item.id, active: !item.active }) });
    load();
  }

  async function remove(item) {
    if (!confirm(`„${item.name}" wirklich löschen?`)) return;
    await api(`/api/admin/menu?id=${item.id}`, adminKey, { method: "DELETE" });
    load();
  }

  if (!items) return <p className="mt-8 text-coffee/60">Lädt…</p>;

  return (
    <div className="mt-8 space-y-8">
      <form onSubmit={save} className="space-y-3 rounded-2xl bg-sand/60 p-5">
        <h3 className="font-display font-bold">{editingId ? "Artikel bearbeiten" : "Neuer Artikel"}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          <input placeholder="Kategorie (z.B. Pizza)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls} />
        </div>
        <input placeholder="Beschreibung" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} />
        <div className="grid gap-3 sm:grid-cols-2">
          <input placeholder={form.is_menu ? "Aktionspreis (€) *" : "Preis (€) *"} type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} />
          {!form.is_menu && (
            <input placeholder="Zubereitungszeit (Min.)" type="number" step="5" min="0" value={form.prep_minutes} onChange={(e) => setForm({ ...form, prep_minutes: e.target.value })} className={inputCls} />
          )}
        </div>
        <input type="file" accept="image/jpeg,image/png,image/webp"
          onChange={(e) => e.target.files[0] && uploadImage(e.target.files[0])} className="text-sm" />
        {uploading && <p className="text-sm text-coffee/60">Bild wird hochgeladen…</p>}
        {form.image_url && <img src={form.image_url} alt="" className="h-20 w-20 rounded-xl object-cover" />}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_menu} onChange={(e) => setForm({ ...form, is_menu: e.target.checked, combo_items: e.target.checked ? form.combo_items : [] })} />
          🔥 Dies ist eine Aktion (Paket aus mehreren Artikeln zum Vorteilspreis)
        </label>
        {form.is_menu && (
          <div className="rounded-xl bg-cream p-3">
            <p className="mb-2 text-sm font-semibold">Enthaltene Artikel auswählen:</p>
            {items.filter((i) => !i.is_menu).length === 0 && (
              <p className="text-sm text-coffee/60">Lege zuerst einzelne Artikel an (z.B. Pizza, Cola, Pommes).</p>
            )}
            <div className="space-y-2">
              {items.filter((i) => !i.is_menu).map((i) => {
                const selected = form.combo_items.find((ci) => ci.id === i.id);
                return (
                  <label key={i.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!selected} onChange={() => toggleComboItem(i)} />
                    <span className="flex-1">{i.name} <span className="text-coffee/50">({euro(i.price)})</span></span>
                    {selected && (
                      <input type="number" min="1" value={selected.qty} onChange={(e) => setComboQty(i.id, e.target.value)}
                        className="w-16 rounded-lg border border-coffee/20 bg-white px-2 py-1 text-sm" />
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}
        {msg && <p className="text-sm text-red-700">{msg}</p>}
        <div className="flex items-center gap-4">
          <button className={btnCls} disabled={uploading}>{editingId ? "Speichern" : "Hinzufügen"}</button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="text-sm text-coffee/60">Abbrechen</button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className={`flex items-center gap-4 rounded-2xl border border-coffee/10 p-4 ${item.active ? "" : "opacity-50"}`}>
            {item.image_url && <img src={item.image_url} alt="" className="h-14 w-14 rounded-xl object-cover" />}
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold">
                {item.is_menu && "🔥 "}{item.name}{" "}
                <span className="text-sm font-normal text-coffee/60">· {item.category}</span>
              </p>
              {item.description && <p className="text-sm text-coffee/65">{item.description}</p>}
              {item.is_menu && item.combo_items?.length > 0 && (
                <p className="text-sm text-coffee/65">
                  Enthält: {item.combo_items.map((ci) => `${ci.qty > 1 ? ci.qty + "× " : ""}${ci.name}`).join(", ")}
                </p>
              )}
              <p className="text-sm font-bold text-terra">
                {euro(item.price)}
                {item.prep_minutes > 0 && <span className="ml-2 font-normal text-coffee/60">· ⏱️ {item.prep_minutes} Min.</span>}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1 text-sm">
              <button onClick={() => toggleActive(item)} className="text-coffee/60 hover:text-coffee">
                {item.active ? "Deaktivieren" : "Aktivieren"}
              </button>
              <button onClick={() => edit(item)} className="text-coffee/60 hover:text-coffee">Bearbeiten</button>
              <button onClick={() => remove(item)} className="text-red-700 hover:text-red-900">Löschen</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="py-8 text-center text-coffee/50">Noch keine Artikel.</p>}
      </div>
    </div>
  );
}
