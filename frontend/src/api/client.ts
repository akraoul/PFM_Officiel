import { API } from "./url.js";

async function json<T>(r: Response): Promise<T> {
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export const clientApi = {
  services: () => fetch(`${API}/services`).then(json<any[]>),
  barbers: () => fetch(`${API}/barbers`).then(json<any[]>),
  gallery: () => fetch(`${API}/gallery`).then(json<any[]>),

  promotions: () => fetch(`${API}/promotions`).then(json<any[]>),

  reviews: (page = 1, limit = 6) =>
    fetch(`${API}/reviews?page=${page}&limit=${limit}`).then(json<any>),

  createReview: (payload: any) =>
    fetch(`${API}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(json),

  createBooking: (payload: any) =>
    fetch(`${API}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(json<{ id: number; code: string }>),

  bookingByCode: (code: string) =>
    fetch(`${API}/bookings/${code}`).then(json<any>),

  blockedSlots: (barberId: number, date: string) =>
    fetch(`${API}/bookings/blocked-slots?barberId=${barberId}&date=${date}&_t=${Date.now()}`).then(json<any[]>)
};
