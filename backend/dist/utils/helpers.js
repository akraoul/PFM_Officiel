import crypto from "crypto";
import db from "../db.js";
export function generateBookingCode() {
    const part = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `PFM-${part}`;
}
export function toISODateTime(date, time) {
    // Use local server time interpretation (User expects "15:00" on their clock)
    return new Date(`${date}T${time}:00`).toISOString();
}
export function addMinutes(iso, minutes) {
    return new Date(new Date(iso).getTime() + minutes * 60000).toISOString();
}
export function pushHistory(booking, action) {
    db.run(`
    INSERT INTO booking_history
    (bookingId, code, clientName, clientPhone, barberId, serviceId, startAt, endAt, peopleCount, note, status, action)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
        booking.id,
        booking.code,
        booking.clientName,
        booking.clientPhone,
        booking.barberId,
        booking.serviceId,
        booking.startAt,
        booking.endAt,
        booking.peopleCount,
        booking.note ?? null,
        booking.status,
        action
    ]);
}
