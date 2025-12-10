import { useEffect, useState } from "react";
import { clientApi } from "../../api/client";
import { toAbsUrl } from "../../api/url";

function formatCountdown(ms: number) {
  if (ms <= 0) return "Акция закончилась";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${d}д ${h}ч ${m}м`;
}

export default function Promotions() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, tick] = useState(0);

  useEffect(() => {
    clientApi.promotions()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const id = setInterval(() => tick(x => x + 1), 60000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <div className="text-neutral-400">Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Акции</h1>

      {items.length === 0 ? (
        <div className="text-neutral-500">Сейчас нет активных акций.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => {
            const expiresMs = p.expiresAt
              ? new Date(p.expiresAt).getTime() - Date.now()
              : null;

            return (
              <div key={p.id} className="card overflow-hidden">
                {p.photo && (
                  <img
                    src={toAbsUrl(p.photo)}
                    className="aspect-video w-full object-cover"
                    alt={p.title}
                  />
                )}

                <div className="card-body space-y-2">
                  <div className="font-semibold text-lg">{p.title}</div>
                  {p.description && (
                    <div className="text-sm text-neutral-300">{p.description}</div>
                  )}

                  {expiresMs !== null && (
                    <div className="badge-yellow w-fit">
                      ⏳ {formatCountdown(expiresMs)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
