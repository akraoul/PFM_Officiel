import { useEffect, useState } from "react";
import { adminApi } from "../../api/admin";
import { useAdminAuth } from "../../auth/AdminAuthContext";

export default function ReviewsAdmin() {
  const { token } = useAdminAuth();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"all"|"approved"|"pending">("all");
  const [q, setQ] = useState("");
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(p=page) {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams({
      page: String(p),
      limit: "10",
      status,
      q: q.trim()
    });
    const res = await adminApi.reviewsPaged(token, params.toString());
    setData(res);
    setLoading(false);
  }

  useEffect(() => { load(1); }, [token, status, q]);

  async function approve(r: any) {
    if (!token) return;
    await adminApi.approveReview(token, r.id, r.isApproved ? 0 : 1);
    load(page);
  }

  async function saveNote(r: any, note: string) {
    if (!token) return;
    await adminApi.setReviewNote(token, r.id, note);
    load(page);
  }

  async function remove(id: number) {
    if (!token) return;
    await adminApi.deleteReview(token, id);
    load(page);
  }

  if (loading || !data) return <div className="text-neutral-400">Загрузка...</div>;

  const items = data.items;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Отзывы (модерация)</h1>

      {/* FILTERS */}
      <div className="card">
        <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="select" value={status} onChange={e=>setStatus(e.target.value as any)}>
            <option value="all">Все</option>
            <option value="approved">Одобренные</option>
            <option value="pending">Ожидают</option>
          </select>

          <input className="input" placeholder="Поиск..." value={q} onChange={e=>setQ(e.target.value)} />

          <div className="text-sm text-neutral-500 flex items-center">
            Всего: {data.total}
          </div>
        </div>
      </div>

      {/* LIST */}
      {items.length === 0 ? (
        <div className="text-neutral-500">Отзывов нет.</div>
      ) : (
        <div className="space-y-3">
          {items.map((r: any) => (
            <ReviewRow
              key={r.id}
              r={r}
              onApprove={() => approve(r)}
              onRemove={() => remove(r.id)}
              onSaveNote={(note)=>saveNote(r, note)}
            />
          ))}
        </div>
      )}

      {/* PAGINATION */}
      <div className="flex items-center justify-center gap-2">
        <button
          className="btn-outline text-sm"
          disabled={data.page <= 1}
          onClick={() => { const p=data.page-1; setPage(p); load(p); }}
        >
          ← Назад
        </button>

        <div className="text-sm text-neutral-400">
          {data.page} / {data.totalPages}
        </div>

        <button
          className="btn-outline text-sm"
          disabled={data.page >= data.totalPages}
          onClick={() => { const p=data.page+1; setPage(p); load(p); }}
        >
          Вперёд →
        </button>
      </div>
    </div>
  );
}

function ReviewRow({
  r, onApprove, onRemove, onSaveNote
}: {
  r: any;
  onApprove: ()=>void;
  onRemove: ()=>void;
  onSaveNote: (note:string)=>void;
}) {
  const [note, setNote] = useState(r.adminNote ?? "");
  const [editing, setEditing] = useState(false);

  return (
    <div className="card">
      <div className="card-body space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <div className="font-semibold">{r.clientName}</div>
          <div className="text-yellow-300">{"⭐".repeat(r.rating)}</div>
        </div>

        <div className="text-neutral-300">{r.comment}</div>

        {/* admin private note */}
        <div className="mt-2 space-y-1">
          <div className="text-xs text-neutral-500">Заметка администратора (не видно клиенту):</div>
          {editing ? (
            <div className="flex gap-2">
              <input className="input" value={note} onChange={e=>setNote(e.target.value)} />
              <button
                className="btn-outline text-xs px-2 py-1"
                onClick={() => { onSaveNote(note); setEditing(false); }}
              >
                Сохранить
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="text-neutral-200">{note || "—"}</div>
              <button className="btn-outline text-xs px-2 py-1" onClick={()=>setEditing(true)}>
                Изменить
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onApprove} className="btn-outline text-xs px-2 py-1">
            {r.isApproved ? "Снять одобрение" : "Одобрить"}
          </button>
          <button onClick={onRemove} className="btn-danger text-xs px-2 py-1">
            Удалить
          </button>
        </div>

        <div className="text-xs text-neutral-500">
          {r.isApproved ? "✅ Одобрено" : "⏳ Ожидает одобрения"}
        </div>
      </div>
    </div>
  );
}
