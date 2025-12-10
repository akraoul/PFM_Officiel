import { useEffect, useMemo, useState } from "react";
import { adminApi, type Booking, type Barber, type Paged } from "../../api/admin";
import { useAdminAuth } from "../../auth/AdminAuthContext";

type BookingStatus = "pending" | "confirmed" | "cancelled" | "done";

const statusLabel: Record<BookingStatus, string> = {
  pending: "Ожидает",
  confirmed: "Подтверждена",
  cancelled: "Отменена",
  done: "Услуга оказана"
};

const badgeClass: Record<BookingStatus, string> = {
  pending: "badge-yellow",
  confirmed: "badge-green",
  cancelled: "badge-red",
  done: "badge-green"
};

export default function Bookings() {
  const { token } = useAdminAuth();

  const [data, setData] = useState<Paged<Booking> | null>(null);
  const [stats, setStats] = useState<{ today: number; week: number; month: number; pending: number } | null>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // filters
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<BookingStatus | "all">("all");
  const [filterDate, setFilterDate] = useState("");
  const [filterBarberId, setFilterBarberId] = useState<number | "">("");
  const [q, setQ] = useState("");

  async function load(p = page) {
    if (!token) return;
    setLoading(true);
    setErr(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", "12");
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterDate) params.set("date", filterDate);
      if (filterBarberId) params.set("barberId", String(filterBarberId));
      if (q.trim()) params.set("q", q.trim());

      const res = await adminApi.bookingsPaged(token, params.toString());
      setData(res);
    } catch (e: any) {
      setErr(e?.message ?? "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  async function loadMeta() {
    if (!token) return;
    try {
      const [st, br] = await Promise.all([
        adminApi.bookingsStats(token),
        adminApi.barbers(token)
      ]);
      setStats(st);
      setBarbers(br);
    } catch {
      // meta errors are non-blocking
    }
  }

  useEffect(() => { loadMeta(); }, [token]);

  // when filters change: reset page to 1 and reload
  useEffect(() => {
    setPage(1);
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filterStatus, filterDate, filterBarberId, q]);

  async function setStatus(id: number, status: BookingStatus) {
    if (!token) return;

    let reason: string | undefined = undefined;
    if (status === "cancelled") {
      const r = prompt("Причина отмены (необязательно):");
      if (r === null) return; // cancelled prompt
      reason = r;
    }

    await adminApi.setBookingStatus(token, id, status, reason);
    load(page);
    loadMeta();
  }

  async function delBooking(id: number) {
    if (!token) return;
    if (!confirm("Удалить запись?")) return;
    await adminApi.deleteBooking(token, id);
    load(page);
    loadMeta();
  }

  // ✅ CSV export with header token
  async function exportCsv() {
    if (!token) return;
    try {
      const r = await fetch(adminApi.exportBookingsCsvUrl(), {
        headers: { "x-admin-token": token }
      });
      if (!r.ok) throw new Error(await r.text());

      const blob = await r.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bookings.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message ?? "Ошибка экспорта CSV");
    }
  }

  const bookings = useMemo(() => data?.items ?? [], [data]);

  if (!token) return <div className="text-neutral-400">Нет доступа</div>;
  if (loading && !data) return <div className="text-neutral-400">Загрузка...</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Записи клиентов</h1>
          <p className="text-sm text-neutral-500">Управление бронированиями и статусами.</p>
        </div>

        <button onClick={exportCsv} className="btn-outline text-sm">
          ⬇️ Экспорт CSV
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card">
            <div className="card-body">
              <div className="text-xs text-neutral-400">Сегодня</div>
              <div className="text-2xl font-bold">{stats.today}</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="text-xs text-neutral-400">Эта неделя</div>
              <div className="text-2xl font-bold">{stats.week}</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="text-xs text-neutral-400">Этот месяц</div>
              <div className="text-2xl font-bold">{stats.month}</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="text-xs text-neutral-400">Ожидают</div>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </div>
          </div>
        </div>
      )}

      {/* FILTERS */}
      <div className="card">
        <div className="card-body grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            className="select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="all">Все статусы</option>
            <option value="pending">Ожидают</option>
            <option value="confirmed">Подтвержденные</option>
            <option value="cancelled">Отменённые</option>
            <option value="done">Выполненные</option>
          </select>

          <input
            type="date"
            className="input"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />

          <select
            className="select"
            value={filterBarberId}
            onChange={(e) => setFilterBarberId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Все барберы</option>
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <input
            className="input"
            placeholder="Поиск..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-red-800 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          {err}
        </div>
      )}

      {/* LIST */}
      {bookings.length === 0 ? (
        <div className="text-neutral-500">Записей нет.</div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="card">
              <div className="card-body">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-semibold text-lg">
                      {b.clientName}{" "}
                      <span className="text-sm text-neutral-400">
                        • {b.clientPhone}
                      </span>
                    </div>

                    <div className="text-sm text-neutral-300">
                      ✂️ {b.barberName} — {b.serviceTitle}
                    </div>

                    <div className="text-sm text-neutral-400">
                      🕒 {new Date(b.startAt).toLocaleString("ru-RU")} —{" "}
                      {new Date(b.endAt).toLocaleTimeString("ru-RU")}
                    </div>

                    <div className="text-xs text-neutral-500">
                      Код: <span className="font-mono">{b.code}</span>
                    </div>

                    {b.note && (
                      <div className="text-xs text-neutral-400 pt-1">
                        💬 {b.note}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-2">
                    <span className={badgeClass[b.status]}>
                      {statusLabel[b.status]}
                    </span>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => setStatus(b.id, "confirmed")}
                        className="btn-outline text-xs px-2 py-1"
                        disabled={b.status === "confirmed"}
                      >
                        Подтвердить
                      </button>

                      <button
                        onClick={() => setStatus(b.id, "cancelled")}
                        className="btn-warning text-xs px-2 py-1"
                        disabled={b.status === "cancelled"}
                      >
                        Отменить
                      </button>

                      <button
                        onClick={() => setStatus(b.id, "done")}
                        className="btn-success text-xs px-2 py-1"
                        disabled={b.status === "done"}
                      >
                        Услуга оказана
                      </button>

                      <button
                        onClick={() => delBooking(b.id)}
                        className="btn-danger text-xs px-2 py-1"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            className="btn-outline text-sm"
            disabled={data.page <= 1}
            onClick={() => {
              const p = data.page - 1;
              setPage(p);
              load(p);
            }}
          >
            ← Назад
          </button>

          <div className="text-sm text-neutral-400">
            {data.page} / {data.totalPages}
          </div>

          <button
            className="btn-outline text-sm"
            disabled={data.page >= data.totalPages}
            onClick={() => {
              const p = data.page + 1;
              setPage(p);
              load(p);
            }}
          >
            Вперёд →
          </button>
        </div>
      )}
    </div>
  );
}
