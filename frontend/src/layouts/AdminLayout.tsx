import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../auth/AdminAuthContext";
import { API } from "../api/url";

function linkClass({ isActive }: { isActive: boolean }) {
  return [
    "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition",
    isActive ? "bg-white text-black" : "text-neutral-200 hover:bg-neutral-900 hover:text-white"
  ].join(" ");
}

export default function AdminLayout() {
  const nav = useNavigate();
  const { token, logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);

  useEffect(() => {
    if (!token) return;

    // SSE connection
    const es = new EventSource(`${API}/admin/events?token=${token}`);

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "new_booking") {
          const { clientName, date, time } = payload.data;
          addToast(`🆕 Новая запись: ${clientName} (${date} ${time})`);
        }
      } catch (e) {
        console.error("SSE Parse Error", e);
      }
    };

    return () => es.close();
  }, [token]);

  function addToast(msg: string) {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, msg }]);
    setTimeout(() => {
      setToasts((p) => p.filter((t) => t.id !== id));
    }, 5000);
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-neutral-950 border-r border-neutral-900 
          transform transition-transform duration-200 ease-in-out md:static md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          flex flex-col
        `}
      >
        <div className="p-4 border-b border-neutral-900 flex items-center gap-3">
          <img src="/assets/logo/PFM_white.png" alt="PFM Logo" className="h-10 w-auto object-contain" />
          <div>
            <div className="font-bold">Админ-панель</div>
            <div className="text-xs text-neutral-500">PFM - ESCOBAR</div>
          </div>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {token && (
            <>
              <NavLink to="/admin" end className={linkClass} onClick={() => setSidebarOpen(false)}>📊 Панель</NavLink>
              <NavLink to="/admin/barbers" className={linkClass} onClick={() => setSidebarOpen(false)}>✂️ Барберы</NavLink>
              <NavLink to="/admin/barber-availability" className={linkClass} onClick={() => setSidebarOpen(false)}>📆 Доступность</NavLink>
              <NavLink to="/admin/bookings" className={linkClass} onClick={() => setSidebarOpen(false)}>📅 Записи</NavLink>
              <NavLink to="/admin/history" className={linkClass} onClick={() => setSidebarOpen(false)}>🗂 История</NavLink>
              <NavLink to="/admin/promotions" className={linkClass} onClick={() => setSidebarOpen(false)}>🏷 Акции</NavLink>
              <NavLink to="/admin/reviews" className={linkClass} onClick={() => setSidebarOpen(false)}>💬 Отзывы</NavLink>
            </>
          )}

          <div className="pt-4 mt-2 border-t border-neutral-900">
            <button
              onClick={() => nav("/")}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-neutral-200 hover:bg-neutral-900 transition"
            >
              🏠 На сайт
            </button>
          </div>
        </nav>

        <div className="p-3 border-t border-neutral-900 space-y-2">
          {token ? (
            <>
              <div className="text-xs text-neutral-500 px-2">
                Статус: <span className="text-green-300">вход выполнен</span>
              </div>
              <button onClick={logout} className="btn-outline w-full text-sm">Выйти</button>
            </>
          ) : (
            <div className="text-xs text-neutral-500 px-2">Для доступа войдите в систему.</div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 border-b border-neutral-900 bg-black/80 backdrop-blur h-16 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 -ml-2 text-neutral-400 hover:text-white"
              onClick={() => setSidebarOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <div className="hidden sm:block text-sm text-neutral-400">
              Минск • НЕМАНСКАЯ, 20 • Пн–Сб 10:00–22:00
            </div>
          </div>

          {token && (
            <button onClick={logout} className="btn-outline text-xs px-3 py-2 md:hidden">Выйти</button>
          )}
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>

      {/* TOAST CONTAINER */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto bg-white text-black px-4 py-3 rounded-xl shadow-2xl border border-neutral-200 animate-bounce"
          >
            <div className="text-sm font-bold">{t.msg}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
