const API_BASE =
  import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

export const API =
  import.meta.env.VITE_API_URL ?? `${API_BASE}/api`;

export function toAbsUrl(p?: string | null) {
  if (!p) return "";
  if (p.startsWith("http")) return p;
  if (p.startsWith("/")) return API_BASE + p;
  return API_BASE + "/" + p;
}
