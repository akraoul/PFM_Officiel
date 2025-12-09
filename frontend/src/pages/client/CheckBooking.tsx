import { useState } from "react";
import { clientApi } from "../../api/client";

export default function CheckBooking() {
  const [code, setCode] = useState("");
  const [data, setData] = useState<any | null>(null);
  const [err, setErr] = useState("");

  async function check(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setData(null);
    try {
      const r = await clientApi.bookingByCode(code.trim());
      setData(r);
    } catch {
      setErr("Бронирование не найдено");
    }
  }

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-2xl font-bold">Проверить запись</h1>

      <form onSubmit={check} className="flex flex-col sm:flex-row gap-2">
        <input className="input flex-1" placeholder="PFM-XXXXXX" value={code} onChange={e => setCode(e.target.value)} />
        <button className="btn w-full sm:w-auto">Проверить</button>
      </form>

      {err && <div className="error">{err}</div>}

      {data && (
        <div className="card">
          <div className="card-body text-sm space-y-1">
            <div><b>Код:</b> {data.code}</div>
            <div><b>Клиент:</b> {data.clientName} ({data.clientPhone})</div>
            <div><b>Барбер:</b> {data.barberName}</div>
            <div><b>Услуга:</b> {data.serviceTitle}</div>
            <div><b>Начало:</b> {new Date(data.startAt).toLocaleString("ru-RU")}</div>
            <div><b>Статус:</b> {data.status}</div>
          </div>
        </div>
      )}
    </div>
  );
}
