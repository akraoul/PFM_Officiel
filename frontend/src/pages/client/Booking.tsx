import { useEffect, useMemo, useState } from "react";
import { clientApi } from "../../api/client";

function minutesToHHMM(m: number) {
  const h = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${h}:${mm}`;
}

// horaires Minsk
function getOpenClose(dateStr: string) {
  const day = new Date(dateStr).getDay(); // 0 dimanche
  if (day === 0) return { open: 11 * 60, close: 22 * 60 };
  return { open: 10 * 60, close: 22 * 60 };
}

export default function Booking() {
  const [services, setServices] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [serviceId, setServiceId] = useState<number | "">("");
  const [barberId, setBarberId] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");

  const [blocked, setBlocked] = useState<{ startAt: string; endAt: string }[]>([]);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setServices(await clientApi.services());
      setBarbers(await clientApi.barbers());
    })();
  }, []);

  useEffect(() => {
    if (!barberId || !date) return;
    clientApi.blockedSlots(Number(barberId), date).then(setBlocked);
  }, [barberId, date]);

  const slots = useMemo(() => {
    if (!date) return [];
    const { open, close } = getOpenClose(date);
    const step = 30;
    const list: string[] = [];
    for (let m = open; m <= close - step; m += step) {
      list.push(minutesToHHMM(m));
    }
    return list;
  }, [date]);

  const selectedDuration = useMemo(() => {
    if (!serviceId) return 0;
    const s = services.find((x) => x.id === Number(serviceId));
    return s ? s.durationMin : 0;
  }, [serviceId, services]);

  // Pre-process blocked slots to timestamps for easier comparison
  const blockedIntervals = useMemo(() => {
    return blocked.map(b => {
      const start = new Date(b.startAt).getTime();
      const end = new Date(b.endAt).getTime();
      return { start, end };
    });
  }, [blocked]);

  function isBlocked(hhmm: string) {
    // Construct the candidate slot in Local Time (matching backend consistency)
    const slotStartStr = `${date}T${hhmm}:00`;
    const slotStart = new Date(slotStartStr).getTime();

    if (isNaN(slotStart)) return false;

    let slotEnd = slotStart;
    if (selectedDuration) {
      slotEnd = slotStart + selectedDuration * 60000;
    }

    // Check overlap
    return blockedIntervals.some(b => {
      // Point check (if no duration or very short)
      if (!selectedDuration) {
        return slotStart >= b.start && slotStart < b.end;
      }
      // Interval overlap: StartA < EndB && EndA > StartB
      return slotStart < b.end && slotEnd > b.start;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId || !barberId) return;
    setError(null);
    setCode(null);

    try {
      const r = await clientApi.createBooking({
        clientName,
        clientPhone,
        serviceId,
        barberId,
        date,
        time,
        note
      });
      setCode(r.code);
    } catch (e: any) {
      setError(e.message || "Ошибка при создании записи");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Запись на услугу</h1>

      {code && (
        <div className="card border-green-700 bg-green-900/10">
          <div className="card-body">
            <div className="font-semibold text-green-400">Ваш код бронирования:</div>
            <div className="text-3xl font-bold mt-2 font-mono">{code}</div>
            <div className="text-sm text-neutral-400 mt-2">Сохраните его для проверки.</div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-900/20 text-red-200 border border-red-900">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-neutral-400">Имя</label>
            <input className="input w-full" placeholder="Имя" value={clientName} onChange={e => setClientName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-neutral-400">Телефон</label>
            <input className="input w-full" placeholder="Телефон" value={clientPhone} onChange={e => setClientPhone(e.target.value)} required />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-neutral-400">Услуга</label>
            <select className="select w-full" value={serviceId} onChange={e => setServiceId(Number(e.target.value))} required>
              <option value="">Выберите услугу</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.title} — {s.price} BYN ({s.durationMin} мин)</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-neutral-400">Барбер</label>
            <select className="select w-full" value={barberId} onChange={e => setBarberId(Number(e.target.value))} required>
              <option value="">Выберите барбера</option>
              {barbers.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-neutral-400">Дата</label>
            <input type="date" className="input w-full" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-neutral-400">Время</label>
            <select className="select w-full" value={time} onChange={e => setTime(e.target.value)} required>
              <option value="">{date ? "Выберите время" : "Сначала выберите дату"}</option>
              {slots.filter(t => {
                if (isBlocked(t)) return false;

                // Extra check: does the service fit before closing time?
                const { close } = getOpenClose(date);
                const [h, m] = t.split(':').map(Number);
                const startMins = h * 60 + m;
                if (selectedDuration && (startMins + selectedDuration > close)) return false;

                return true;
              }).map(t => (
                <option key={t} value={t}>
                  {t} {selectedDuration ? `- ${minutesToHHMM(Number(t.split(':')[0]) * 60 + Number(t.split(':')[1]) + selectedDuration)}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-neutral-400">Комментарий</label>
          <textarea className="textarea w-full" placeholder="Дополнительные пожелания" value={note} onChange={e => setNote(e.target.value)} />
        </div>

        <button className="btn w-full sm:w-auto">Подтвердить запись</button>
      </form>
    </div>
  );
}
