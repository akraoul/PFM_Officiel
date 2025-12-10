import { useEffect, useState } from "react";
import { adminApi } from "../../api/admin";
import { useAdminAuth } from "../../auth/AdminAuthContext";

export default function History() {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    if (!token) return;
    setItems(await adminApi.bookingsHistory(token, q.trim() || undefined));
  }

  useEffect(() => { load(); }, [token]);
  useEffect(() => { load(); }, [q]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">История записей</h1>

      <input className="input max-w-xl" placeholder="Поиск по коду / имени / телефону..."
        value={q} onChange={(e) => setQ(e.target.value)} />

      {items.length === 0 ? (
        <div className="text-neutral-500">История пуста.</div>
      ) : (
        <div className="space-y-2">
          {items.map((h) => (
            <div key={h.id} className="card">
              <div className="card-body text-sm space-y-1">
                <div className="font-semibold">{h.clientName} • {h.clientPhone}</div>
                <div className="text-neutral-400">
                  Код: <span className="font-mono">{h.code}</span> · Статус: {h.status}
                </div>
                <div className="text-neutral-400">
                  Действие: {h.action} · {new Date(h.actionAt).toLocaleString("ru-RU")}
                </div>
                <div>🕒 {new Date(h.startAt).toLocaleString("ru-RU")}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
