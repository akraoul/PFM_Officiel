export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Barber {
  id: number;
  name: string;
  photo: string;
  role: string;
  isActive: 0 | 1;
}

export interface Service {
  id: number;
  title: string;
  category: string;
  price: number;
  durationMin: number;
  photo?: string | null;
  isActive: 0 | 1;
}

export interface Promotion {
  id: number;
  title: string;
  description: string;
  price: number;
  photo?: string | null;
  isActive: 0 | 1;
}

export interface Review {
  id: number;
  clientName: string;
  rating: number;
  comment: string;
  createdAt: string;
  isApproved: 0 | 1;
}

export interface GalleryItem {
  id: number;
  photo: string;
  caption?: string | null;
  createdAt: string;
  isActive: 0 | 1;
}

export interface Booking {
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
  createdAt: string;
}
