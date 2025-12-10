import { API } from "./url.js";

/**
 * Parse JSON en sécurité :
 * - si le backend renvoie du texte non-JSON -> on le garde comme message d'erreur
 * - si réponse vide -> retourne null
 */
async function json<T>(r: Response): Promise<T> {
  const text = await r.text();

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text; // pas du JSON => on garde le texte brut
  }

  if (!r.ok) {
    const msg =
      (typeof data === "object" && data?.error) ||
      (typeof data === "string" && data) ||
      r.statusText;

    throw new Error(msg);
  }

  return data as T;
}

// ---------------- TYPES ----------------

export type Service = {
  id: number;
  title: string;
  category: string;
  price: number;
  durationMin: number;
  photo?: string | null;
  isActive: 0 | 1;
};

export type Barber = {
  id: number;
  name: string;
  role: string;
  photo?: string | null;
  isActive: 0 | 1;
};

export type GalleryItem = {
  id: number;
  photo: string;
  caption?: string | null;
  isActive: 0 | 1;
  createdAt: string;
};

export type Promotion = {
  id: number;
  title: string;
  description?: string | null;
  photo?: string | null;
  expiresAt?: string | null;

  // dans la DB c'est "price", dans l'app c'est discountPercent
  discountPercent: number;

  isActive: 0 | 1;
};


export type Review = {
  id: number;
  clientName: string;
  rating: number;
  comment: string;
  createdAt: string;
  isApproved: 0 | 1;
  adminNote?: string | null;
};

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "done";

export type Booking = {
  id: number;
  code: string;
  clientName: string;
  clientPhone: string;
  barberId: number;
  serviceId: number;
  startAt: string;
  endAt: string;
  peopleCount: number;
  note?: string | null;
  status: BookingStatus;
  barberName?: string;
  serviceTitle?: string;
  cancellationReason?: string | null;
};

export type Paged<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

// ---------------- API ----------------

export const adminApi = {
  // ================= AUTH =================
  login: (token: string) =>
    fetch(`${API}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    }).then(json<{ ok: boolean }>),

  // ================= SERVICES =================
  services: (token: string) =>
    fetch(`${API}/admin/services`, {
      headers: { "x-admin-token": token }
    }).then(json<Service[]>),

  createService: (token: string, formData: FormData) =>
    fetch(`${API}/admin/services`, {
      method: "POST",
      headers: { "x-admin-token": token },
      body: formData
    }).then(json<{ id: number; photo: string | null }>),

  updateService: (token: string, id: number, payload: Partial<Service>) =>
    fetch(`${API}/admin/services/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token
      },
      body: JSON.stringify(payload)
    }).then(json<{ changed: number }>),

  deleteService: (token: string, id: number) =>
    fetch(`${API}/admin/services/${id}`, {
      method: "DELETE",
      headers: { "x-admin-token": token }
    }).then(json<{ deleted: number }>),

  // ================= BARBERS =================
  barbers: (token: string) =>
    fetch(`${API}/admin/barbers`, {
      headers: { "x-admin-token": token }
    }).then(json<Barber[]>),

  createBarber: (token: string, formData: FormData) =>
    fetch(`${API}/admin/barbers`, {
      method: "POST",
      headers: { "x-admin-token": token },
      body: formData
    }).then(json<{ id: number; photo: string }>),

  updateBarber: (token: string, id: number, payload: Partial<Barber>) =>
    fetch(`${API}/admin/barbers/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token
      },
      body: JSON.stringify(payload)
    }).then(json<{ changed: number }>),

  deleteBarber: (token: string, id: number) =>
    fetch(`${API}/admin/barbers/${id}`, {
      method: "DELETE",
      headers: { "x-admin-token": token }
    }).then(json<{ deleted: number }>),

  // ================= GALLERY =================
  gallery: (token: string) =>
    fetch(`${API}/admin/gallery`, {
      headers: { "x-admin-token": token }
    }).then(json<GalleryItem[]>),

  createGalleryItem: (token: string, formData: FormData) =>
    fetch(`${API}/admin/gallery`, {
      method: "POST",
      headers: { "x-admin-token": token },
      body: formData
    }).then(json<{ id: number; photo: string }>),

  updateGalleryItem: (token: string, id: number, payload: Partial<GalleryItem>) =>
    fetch(`${API}/admin/gallery/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token
      },
      body: JSON.stringify(payload)
    }).then(json<{ changed: number }>),

  deleteGalleryItem: (token: string, id: number) =>
    fetch(`${API}/admin/gallery/${id}`, {
      method: "DELETE",
      headers: { "x-admin-token": token }
    }).then(json<{ deleted: number }>),

  // ================= PROMOTIONS (V2 upload) =================
  promotions: (token: string) =>
    fetch(`${API}/admin/promotions`, {
      headers: { "x-admin-token": token }
    })
      .then(json<any[]>)
      .then(rows =>
        rows.map(r => ({
          ...r,
          discountPercent: r.price
        }))
      ),


  createPromotion: (token: string, formData: FormData) =>
    fetch(`${API}/admin/promotions`, {
      method: "POST",
      headers: { "x-admin-token": token },
      body: formData
    }).then(json<{ id: number; photo: string | null }>),

  updatePromotion: (token: string, id: number, payload: Partial<Promotion>) =>
    fetch(`${API}/admin/promotions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token
      },
      body: JSON.stringify(payload)
    }).then(json<{ changed: number }>),

  deletePromotion: (token: string, id: number) =>
    fetch(`${API}/admin/promotions/${id}`, {
      method: "DELETE",
      headers: { "x-admin-token": token }
    }).then(json<{ deleted: number }>),

  // ================= REVIEWS (PAGED) =================
  reviewsPaged: (token: string, qs: string) =>
    fetch(`${API}/admin/reviews?${qs}`, {
      headers: { "x-admin-token": token }
    }).then(json<Paged<Review>>),

  approveReview: (token: string, id: number, isApproved: 0 | 1) =>
    fetch(`${API}/admin/reviews/${id}/approve`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token
      },
      body: JSON.stringify({ isApproved })
    }).then(json<{ changed: number }>),

  setReviewNote: (token: string, id: number, adminNote: string) =>
    fetch(`${API}/admin/reviews/${id}/note`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token
      },
      body: JSON.stringify({ adminNote })
    }).then(json<{ changed: number }>),

  deleteReview: (token: string, id: number) =>
    fetch(`${API}/admin/reviews/${id}`, {
      method: "DELETE",
      headers: { "x-admin-token": token }
    }).then(json<{ deleted: number }>),

  // ================= BOOKINGS (ADMIN) =================
  bookingsPaged: (token: string, qs: string) =>
    fetch(`${API}/admin/bookings?${qs}`, {
      headers: { "x-admin-token": token }
    }).then(json<Paged<Booking>>),

  setBookingStatus: (token: string, id: number, status: BookingStatus, cancellationReason?: string) =>
    fetch(`${API}/admin/bookings/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token
      },
      body: JSON.stringify({ status, cancellationReason })
    }).then(json<{ changed: number }>),

  deleteBooking: (token: string, id: number) =>
    fetch(`${API}/admin/bookings/${id}`, {
      method: "DELETE",
      headers: { "x-admin-token": token }
    }).then(json<{ deleted: number }>),

  bookingsStats: (token: string) =>
    fetch(`${API}/admin/bookings/stats`, {
      headers: { "x-admin-token": token }
    }).then(
      json<{ today: number; week: number; month: number; pending: number }>
    ),

  exportBookingsCsvUrl: () => `${API}/admin/bookings/export.csv`,

  bookingsHistory: (token: string, q?: string) =>
    fetch(
      `${API}/admin/bookings/history${q ? `?q=${encodeURIComponent(q)}` : ""}`,
      {
        headers: { "x-admin-token": token }
      }
    ).then(json<any[]>),

  // ================= BARBER AVAILABILITY =================
  getBarberAvailability: (token: string, barberId: number) =>
    fetch(`${API}/admin/barbers/${barberId}/availability`, {
      headers: { "x-admin-token": token }
    }).then(json<any[]>),

  createBarberAvailability: (token: string, barberId: number, payload: { startDate: string; endDate: string; reason?: string }) =>
    fetch(`${API}/admin/barbers/${barberId}/availability`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token
      },
      body: JSON.stringify(payload)
    }).then(json<{ id: number; success: boolean }>),

  deleteBarberAvailability: (token: string, id: number) =>
    fetch(`${API}/admin/barbers/availability/${id}`, {
      method: "DELETE",
      headers: { "x-admin-token": token }
    }).then(json<{ success: boolean }>)
};
