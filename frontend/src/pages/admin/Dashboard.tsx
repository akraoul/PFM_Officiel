import { useEffect, useState } from "react";
import { adminApi } from "../../api/admin";
import { useAdminAuth } from "../../auth/AdminAuthContext";
import { toAbsUrl } from "../../api/url";

export default function Dashboard() {
  const { token } = useAdminAuth();
  const [services, setServices] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);

  // service form
  const [sf, setSf] = useState({
    title: "",
    category: "Стрижки",
    price: "" as any,
    durationMin: "" as any
  });
  const [servicePhoto, setServicePhoto] = useState<File | null>(null);

  // gallery form
  const [gc, setGc] = useState("");
  const [gp, setGp] = useState<File | null>(null);

  async function load() {
    if (!token) return;
    setServices(await adminApi.services(token));
    setGallery(await adminApi.gallery(token));
  }

  useEffect(() => { load(); }, [token]);

  async function addService(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    const fd = new FormData();
    fd.append("title", sf.title);
    fd.append("category", sf.category);
    fd.append("price", String(sf.price));
    fd.append("durationMin", String(sf.durationMin));
    if (servicePhoto) fd.append("photo", servicePhoto);

    await adminApi.createService(token, fd);
    setSf({ title: "", category: "Стрижки", price: "" as any, durationMin: "" as any });
    setServicePhoto(null);
    load();
  }

  async function toggleService(s: any) {
    if (!token) return;
    await adminApi.updateService(token, s.id, { ...s, isActive: s.isActive ? 0 : 1 });
    load();
  }

  async function delService(id: number) {
    if (!token) return;
    await adminApi.deleteService(token, id);
    load();
  }

  async function addGallery(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !gp) return;

    const fd = new FormData();
    fd.append("caption", gc);
    fd.append("photo", gp);

    await adminApi.createGalleryItem(token, fd);
    setGc(""); setGp(null);
    load();
  }

  async function toggleGallery(g: any) {
    if (!token) return;
    await adminApi.updateGalleryItem(token, g.id, { ...g, isActive: g.isActive ? 0 : 1 });
    load();
  }

  async function delGallery(id: number) {
    if (!token) return;
    await adminApi.deleteGalleryItem(token, id);
    load();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Панель администратора</h1>

      {/* SERVICES */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Услуги</h2>

        <form onSubmit={addService} className="card">
          <div className="card-body grid grid-cols-1 md:grid-cols-6 gap-3">
            <input className="input md:col-span-2" placeholder="Название"
              value={sf.title} onChange={e => setSf(v => ({ ...v, title: e.target.value }))} required />

            <select className="select" value={sf.category}
              onChange={e => setSf(v => ({ ...v, category: e.target.value }))}>
              <option>Стрижки</option>
              <option>Комплексы</option>
              <option>Другие услуги</option>
            </select>

            <input className="input" type="number" placeholder="Цена (BYN)"
              value={sf.price} onChange={e => setSf(v => ({ ...v, price: e.target.value ? Number(e.target.value) : "" }))} required />

            <input className="input" type="number" placeholder="Длительность (мин)"
              value={sf.durationMin} onChange={e => setSf(v => ({ ...v, durationMin: e.target.value ? Number(e.target.value) : "" }))} required />

            <input className="input" type="file" accept="image/*"
              onChange={e => setServicePhoto(e.target.files?.[0] ?? null)} />

            <button className="btn md:col-span-6">Добавить услугу</button>
          </div>
        </form>

        <div className="grid md:grid-cols-2 gap-3">
          {services.map(s => (
            <div key={s.id} className="card p-3 flex gap-3">
              {s.photo && <img src={toAbsUrl(s.photo)} className="w-24 h-20 object-cover rounded-xl" />}
              <div className="flex-1">
                <div className="font-semibold">{s.title}</div>
                <div className="text-sm text-neutral-400">{s.category} • {s.durationMin} мин</div>
                <div className="font-bold">{s.price} BYN</div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => toggleService(s)} className="btn-outline text-xs px-2 py-1">
                  {s.isActive ? "Скрыть" : "Показать"}
                </button>
                <button onClick={() => delService(s.id)} className="btn-danger text-xs px-2 py-1">
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GALLERY */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Галерея</h2>

        <form onSubmit={addGallery} className="card">
          <div className="card-body flex flex-col md:flex-row gap-3">
            <input className="input flex-1" placeholder="Подпись" value={gc} onChange={e => setGc(e.target.value)} />
            <input className="input" type="file" accept="image/*" onChange={e => setGp(e.target.files?.[0] ?? null)} required />
            <button className="btn">Добавить</button>
          </div>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {gallery.map(g => (
            <div key={g.id} className="rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900">
              <img src={toAbsUrl(g.photo)} className="h-32 w-full object-cover" />
              <div className="p-2 text-xs text-neutral-300">{g.caption || "—"}</div>
              <div className="flex">
                <button onClick={() => toggleGallery(g)} className="flex-1 text-xs py-2 border-t border-neutral-800">
                  {g.isActive ? "Скрыть" : "Показать"}
                </button>
                <button onClick={() => delGallery(g.id)} className="flex-1 text-xs py-2 border-t border-neutral-800 text-red-300">
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
