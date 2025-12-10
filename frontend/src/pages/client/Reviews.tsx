import { useEffect, useState } from "react";
import { clientApi } from "../../api/client";

export default function Reviews() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [clientName, setClientName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  async function load(p = page) {
    setLoading(true);
    const res = await clientApi.reviews(p, 6);
    setData(res);
    setLoading(false);
  }

  useEffect(() => { load(1); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setSent(false);

    try {
      await clientApi.createReview({ clientName, rating, comment });
      setClientName(""); setRating(5); setComment("");
      setSent(true);
    } catch {
      setErr("Ошибка отправки отзыва");
    }
  }

  if (loading || !data) return <div className="text-neutral-400">Загрузка...</div>;

  const reviews = data.items;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Отзывы</h1>

      {/* FORM */}
      <form onSubmit={submit} className="card max-w-xl">
        <div className="card-body space-y-3">
          <div className="font-semibold">Оставить отзыв</div>

          <input
            className="input"
            placeholder="Ваше имя"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
          />

          <select className="select" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            <option value={5}>5 ⭐⭐⭐⭐⭐</option>
            <option value={4}>4 ⭐⭐⭐⭐</option>
            <option value={3}>3 ⭐⭐⭐</option>
            <option value={2}>2 ⭐⭐</option>
            <option value={1}>1 ⭐</option>
          </select>

          <textarea
            className="textarea"
            placeholder="Ваш комментарий"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          />

          {err && <div className="error">{err}</div>}
          {sent && <div className="success">Спасибо! Отзыв отправлен на модерацию.</div>}

          <button className="btn">Отправить</button>
        </div>
      </form>

      {/* LIST */}
      {reviews.length === 0 ? (
        <div className="text-neutral-500">Пока нет отзывов.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {reviews.map((r: any) => (
            <div key={r.id} className="card">
              <div className="card-body space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{r.clientName}</div>
                  <div className="text-yellow-300 text-sm">{"⭐".repeat(r.rating)}</div>
                </div>
                <div className="text-sm text-neutral-300">{r.comment}</div>
              </div>
            </div>
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
