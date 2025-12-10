import { useState } from "react";
import { adminApi } from "../../api/admin";
import { useAdminAuth } from "../../auth/AdminAuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const { setToken } = useAdminAuth();

  const [token, setTok] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    const clean = token.trim();
    if (!clean) {
      setErr("Введите токен");
      return;
    }

    try {
      setLoading(true);
      const r = await adminApi.login(clean);

      if (r.ok) {
        setToken(clean);
        nav("/admin");
      } else {
        throw new Error("Неверный токен");
      }
    } catch (e: any) {
      setErr(e?.message ?? "Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] grid place-items-center">
      <form onSubmit={submit} className="card w-full max-w-md">
        <div className="card-body space-y-3">
          <h1 className="text-2xl font-bold">Вход администратора</h1>

          <input
            className="input"
            placeholder="ADMIN_TOKEN"
            value={token}
            onChange={(e) => setTok(e.target.value)}
          />

          {err && <div className="error">{err}</div>}

          <button className="btn w-full" disabled={loading}>
            {loading ? "Загрузка..." : "Войти"}
          </button>
        </div>
      </form>
    </div>
  );
}
