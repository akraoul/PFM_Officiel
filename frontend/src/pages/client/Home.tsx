import { useEffect, useState } from "react";
import { clientApi } from "../../api/client";
import { toAbsUrl } from "../../api/url";

export default function Home() {
  const [services, setServices] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, b] = await Promise.all([clientApi.services(), clientApi.barbers()]);
        setServices(s);
        setBarbers(b);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-neutral-400">Загрузка...</div>;

  return (
    <div className="space-y-10">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">Добро пожаловать в PFM - ESCOBAR</h1>
        <p className="text-neutral-400 text-lg">Запишитесь на стрижку за пару кликов.</p>

        <div className="text-sm text-neutral-500 pt-2 space-y-1">
          <div>🕒 Пн–Сб: 10:00–22:00</div>
          <div>🕒 Вс: 11:00–22:00</div>
          <div>📍 Минск, НЕМАНСКАЯ, 20</div>
          <div className="pt-2 font-medium text-white text-base">📞 +375 29 667 09 06</div>
          <a href="https://www.instagram.com/pfm_escobar?igsh=MWZoZ21jbno5bnB6NQ==" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-neutral-400 hover:text-brand-green w-fit transition pt-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
            <span>Instagram</span>
          </a>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Услуги</h2>

        {services.length === 0 ? (
          <div className="text-neutral-500">Услуги пока не добавлены.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s) => (
              <div key={s.id} className="card group">
                {s.photo && (
                  <img
                    src={toAbsUrl(s.photo)}
                    className="h-52 w-full object-cover cursor-pointer hover:opacity-90 transition"
                    onClick={() => setActiveImage(toAbsUrl(s.photo))}
                  />
                )}
                <div className="p-3 space-y-1">
                  <div className="font-semibold text-base">{s.title}</div>
                  <div className="text-xs text-neutral-400">{s.category}</div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-neutral-300">{s.durationMin} мин</div>
                    <div className="font-bold text-sm bg-brand-green/20 text-brand-light px-2 py-1 rounded-lg">{s.price} BYN</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Наши барберы</h2>

        {barbers.length === 0 ? (
          <div className="text-neutral-500">Барберы пока не добавлены.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {barbers.map((b) => (
              <div key={b.id} className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3 text-center">
                <img src={toAbsUrl(b.photo)} alt={b.name} className="h-44 w-full object-cover rounded-xl" />
                <div className="mt-2 font-medium">{b.name}</div>
                <div className="text-xs text-neutral-400">{b.role}</div>
              </div>
            ))}
          </div>
        )}
      </section>
      {activeImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer" onClick={() => setActiveImage(null)}>
          <img src={activeImage} className="max-h-[85vh] max-w-[95vw] rounded-xl shadow-2xl" />
          <button className="absolute top-4 right-4 text-white hover:text-brand-green">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
