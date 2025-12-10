import { useEffect, useState } from "react";
import { adminApi, type Promotion } from "../../api/admin";
import { useAdminAuth } from "../../auth/AdminAuthContext";
import { toAbsUrl } from "../../api/url";

export default function PromotionsPage() {
  const { token } = useAdminAuth();

  const [items, setItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(""); // ✅ on garde string
  const [expiresAt, setExpiresAt] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [photo, setPhoto] = useState<File | null>(null);

  async function load() {
    if (!token) return;
    setLoading(true);
    setErr("");
    try {
      const data = await adminApi.promotions(token);
      setItems(data);
    } catch (e: any) {
      setErr(e?.message ?? "Ошибка загрузки акций");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || saving) return;

    setSaving(true);
    setErr("");

    try {
      const cleanTitle = title.trim();
      if (!cleanTitle) {
        setErr("Название обязательно");
        return;
      }

      const dp = Number(discountPercent);
      if (Number.isNaN(dp) || dp < 0 || dp > 100) {
        setErr("Скидка должна быть 0..100%");
        return;
      }

      const fd = new FormData();
      fd.append("title", cleanTitle);

      // ✅ toujours envoyer description (même vide)
      fd.append("description", description.trim());

      if (expiresAt) fd.append("expiresAt", expiresAt);
      fd.append("discountPercent", String(dp));
      if (photo) fd.append("photo", photo);

      await adminApi.createPromotion(token, fd);

      // reset
      setTitle("");
      setDescription("");
      setExpiresAt("");
      setDiscountPercent(0);
      setPhoto(null);

      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Ошибка при добавлении акции");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: Promotion) {
    if (!token) return;
    setErr("");

    try {
      await adminApi.updatePromotion(token, p.id, {
        title: p.title,
        description: p.description ?? "",
        expiresAt: p.expiresAt ?? null,
        discountPercent: p.discountPercent,
        isActive: p.isActive ? 0 : 1
      } as any);

      load();
    } catch (e: any) {
      setErr(e?.message ?? "Ошибка обновления");
    }
  }

  async function remove(id: number) {
    if (!token) return;
    setErr("");
    if (!confirm("Удалить акцию?")) return;

    try {
      await adminApi.deletePromotion(token, id);
      load();
    } catch (e: any) {
      setErr(e?.message ?? "Ошибка удаления");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Акции</h1>
        <p className="text-sm text-neutral-500">
          Добавляйте новые акции, указывайте процент скидки.
        </p>
      </div>

      {err && <div className="error">{err}</div>}

      {/* FORM */}
      <form onSubmit={submit} encType="multipart/form-data" className="card max-w-2xl">
        <div className="card-body space-y-3">
          <input
            className="input"
            placeholder="Название акции"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            className="input min-h-[90px]"
            placeholder="Описание (обязательно)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required  // ✅ obligatoire pour l’UI aussi
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="date"
              className="input"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />

            <input
              type="file"
              accept="image/*"
              className="input pt-2"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
          </div>

          <input
            type="number"
            min={0}
            max={100}
            className="input"
            placeholder="Скидка (%)"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(Number(e.target.value))}
            required
          />

          <button className="btn w-fit" disabled={saving}>
            {saving ? "Добавление..." : "Добавить акцию"}
          </button>

          <div className="text-xs text-neutral-500">
            Если дата не выбрана — акция без срока.
          </div>
        </div>
      </form>

      {/* LIST */}
      {loading ? (
        <div className="text-neutral-400">Загрузка...</div>
      ) : items.length === 0 ? (
        <div className="text-neutral-500">Акций пока нет.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((p) => (
            <div key={p.id} className="card">
              <div className="card-body space-y-2">
                {p.photo && (
                  <img
                    src={toAbsUrl(p.photo)}
                    alt={p.title}
                    className="w-full h-40 object-cover rounded-xl border border-neutral-800"
                  />
                )}

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{p.title}</div>
                    <div className="text-sm text-neutral-400 whitespace-pre-wrap">
                      {p.description}
                    </div>
                    <div className="text-xs text-neutral-500 pt-1">
                      Срок:{" "}
                      {p.expiresAt
                        ? new Date(p.expiresAt).toLocaleDateString("ru-RU")
                        : "без срока"}
                    </div>
                    <div className="text-sm pt-1">
                      Скидка: <b>{p.discountPercent}%</b>
                    </div>
                  </div>

                  <span className={p.isActive ? "badge-green" : "badge-red"}>
                    {p.isActive ? "Активна" : "Отключена"}
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => toggleActive(p)}
                    className="btn-outline text-xs px-2 py-1"
                  >
                    {p.isActive ? "Отключить" : "Включить"}
                  </button>

                  <button
                    onClick={() => remove(p.id)}
                    className="btn-danger text-xs px-2 py-1"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
