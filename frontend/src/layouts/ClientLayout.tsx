import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

function linkClass({ isActive }: { isActive: boolean }) {
  return [
    "px-3 py-2 rounded-xl text-sm font-medium transition",
    isActive ? "bg-white text-black" : "text-neutral-200 hover:bg-neutral-900 hover:text-white"
  ].join(" ");
}

export default function ClientLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-brand-dark/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3 group" onClick={() => setMenuOpen(false)}>
            <img src="/assets/logo/PFM_white.png" alt="PFM" className="h-16 w-auto object-contain group-hover:scale-105 transition" />
            <div className="leading-tight">
              <div className="font-bold text-lg tracking-tight">PFM Barbershop</div>
              <div className="text-xs text-brand-gray">Минск • НЕМАНСКАЯ, 20</div>
            </div>
          </NavLink>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-brand-dark/50 p-1 rounded-2xl border border-white/5 backdrop-blur-sm">
            <NavLink to="/" className={linkClass} end>Главная</NavLink>
            <NavLink to="/booking" className={linkClass}>Запись</NavLink>
            <NavLink to="/check-booking" className={linkClass}>Проверить</NavLink>
            <NavLink to="/gallery" className={linkClass}>Галерея</NavLink>
            <NavLink to="/promotions" className={linkClass}>Акции</NavLink>
            <NavLink to="/reviews" className={linkClass}>Отзывы</NavLink>
          </nav>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-3">
            <NavLink to="/booking" className="btn text-xs px-4 py-2" onClick={() => setMenuOpen(false)}>
              Записаться
            </NavLink>

            <button
              className="p-2 text-brand-light hover:bg-white/10 rounded-xl transition"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 12" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {
          menuOpen && (
            <div className="md:hidden border-t border-white/5 bg-brand-dark/95 backdrop-blur-xl absolute left-0 right-0 shadow-2xl animate-in fade-in slide-in-from-top-5 duration-200">
              <div className="p-4 grid grid-cols-2 gap-3">
                <NavLink to="/" className={linkClass} onClick={() => setMenuOpen(false)} end>🏠 Главная</NavLink>
                <NavLink to="/booking" className={linkClass} onClick={() => setMenuOpen(false)}>✂️ Запись</NavLink>
                <NavLink to="/check-booking" className={linkClass} onClick={() => setMenuOpen(false)}>🔍 Проверить</NavLink>
                <NavLink to="/gallery" className={linkClass} onClick={() => setMenuOpen(false)}>📷 Галерея</NavLink>
                <NavLink to="/promotions" className={linkClass} onClick={() => setMenuOpen(false)}>🔥 Акции</NavLink>
                <NavLink to="/reviews" className={linkClass} onClick={() => setMenuOpen(false)}>⭐ Отзывы</NavLink>
              </div>
              <div className="p-4 border-t border-white/5 text-center text-xs text-brand-gray">
                <div className="mb-1">📍 Минск, ул. НЕМАНСКАЯ, 20</div>
                <div>📞 +375 (29) 123-45-67</div>
              </div>
            </div>
          )
        }
      </header >

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-neutral-900 bg-neutral-950">
        <div className="mx-auto max-w-6xl px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="space-y-2">
            <div className="font-semibold">PFM Barbershop</div>
            <div className="text-neutral-400">Профессиональные стрижки и уход за бородой в Минске.</div>
          </div>
          <div className="space-y-2">
            <div className="font-semibold">Время работы</div>
            <div className="text-neutral-300">Пн–Сб: 10:00–22:00</div>
            <div className="text-neutral-300">Вс: 11:00–22:00</div>
          </div>
          <div className="space-y-2">
            <div className="font-semibold">Адрес</div>
            <div className="text-neutral-300">Минск, НЕМАНСКАЯ, 20</div>
            <div className="text-neutral-500 text-xs">© {new Date().getFullYear()} PFM Barbershop</div>
          </div>
        </div>
      </footer>
    </div >
  );
}
