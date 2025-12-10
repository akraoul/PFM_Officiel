import { useEffect, useState } from "react";
import { clientApi } from "../../api/client";
import { toAbsUrl } from "../../api/url";

export default function Gallery() {
  const [items, setItems] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    clientApi.gallery().then(setItems);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Галерея</h1>

      {items.length === 0 ? (
        <div className="text-neutral-500">Галерея пуста.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((g) => (
            <button
              key={g.id}
              className="rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900"
              onClick={() => setActive(toAbsUrl(g.photo))}
            >
              <img src={toAbsUrl(g.photo)} className="aspect-square w-full object-cover hover:scale-105 transition" />
            </button>
          ))}
        </div>
      )}

      {active && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6" onClick={() => setActive(null)}>
          <img src={active} className="max-h-[90vh] max-w-[90vw] rounded-2xl" />
        </div>
      )}
    </div>
  );
}
