import { useEffect, useState } from "react";
import { adminApi } from "../../api/admin";
import { useAdminAuth } from "../../auth/AdminAuthContext";
import { toAbsUrl } from "../../api/url";

export default function Barbers() {
  const { token } = useAdminAuth();
  const [barbers, setBarbers] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("Барбер");
  const [photo, setPhoto] = useState<File | null>(null);

  async function refresh() {
    if (!token) return;
    setBarbers(await adminApi.barbers(token));
  }

  useEffect(() => { refresh(); }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !photo) return;

    const fd = new FormData();
    fd.append("name", name);
    fd.append("role", role);
    fd.append("photo", photo);

    await adminApi.createBarber(token, fd);
    setName(""); setRole("Барбер"); setPhoto(null);
    refresh();
  }

  async function toggleActive(b: any) {
    if (!token) return;
    await adminApi.updateBarber(token, b.id, { ...b, isActive: b.isActive ? 0 : 1 });
    refresh();
  }

  async function remove(id: number) {
    if (!token) return;
    await adminApi.deleteBarber(token, id);
    refresh();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Барберы</h1>

      <form onSubmit={submit} className="card max-w-md">
        <div className="card-body space-y-3">
          <input className="input" placeholder="Имя" value={name} onChange={e=>setName(e.target.value)} required />
          <input className="input" placeholder="Роль" value={role} onChange={e=>setRole(e.target.value)} />
          <input className="input" type="file" accept="image/*" onChange={e=>setPhoto(e.target.files?.[0] ?? null)} required />
          <button className="btn">Добавить барбера</button>
        </div>
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {barbers.map((b) => (
          <div key={b.id} className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3 text-center space-y-2">
            <img src={toAbsUrl(b.photo)} alt={b.name} className="h-28 w-full object-cover rounded-xl" />
            <div className="font-medium">{b.name}</div>
            <div className="text-xs text-neutral-400">{b.role}</div>

            <div className="flex justify-center gap-2 pt-1">
              <button onClick={() => toggleActive(b)} className="btn-outline text-xs px-2 py-1">
                {b.isActive ? "Скрыть" : "Показать"}
              </button>
              <button onClick={() => remove(b.id)} className="btn-danger text-xs px-2 py-1">
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
