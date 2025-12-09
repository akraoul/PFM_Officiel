import { Request, Response } from "express";
import db from "../db.js";
import { generateBookingCode, toISODateTime, addMinutes } from "../utils/helpers.js";

// -- GET /api/services
export const getServices = (_req: Request, res: Response) => {
    db.all("SELECT * FROM services ORDER BY createdAt DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

// -- GET /api/barbers
export const getBarbers = (_req: Request, res: Response) => {
    db.all("SELECT * FROM barbers ORDER BY createdAt DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

// -- GET /api/gallery
export const getGallery = (_req: Request, res: Response) => {
    db.all("SELECT * FROM gallery ORDER BY createdAt DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

// -- GET /api/promotions
export const getPromotions = (_req: Request, res: Response) => {
    db.all("SELECT * FROM promotions ORDER BY createdAt DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

// -- GET /api/reviews
export const getReviews = (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 6;
    const offset = (page - 1) * limit;

    db.get("SELECT COUNT(*) as count FROM reviews WHERE approved=1", [], (err, row: any) => {
        if (err) return res.status(500).json({ error: err.message });
        const totalItems = row.count;
        const totalPages = Math.ceil(totalItems / limit);

        db.all(
            "SELECT * FROM reviews WHERE approved=1 ORDER BY createdAt DESC LIMIT ? OFFSET ?",
            [limit, offset],
            (err2, rows) => {
                if (err2) return res.status(500).json({ error: err2.message });
                res.json({
                    page,
                    totalPages,
                    totalItems,
                    items: rows
                });
            }
        );
    });
};

// -- POST /api/reviews
export const createReview = (req: Request, res: Response) => {
    const { clientName, rating, comment } = req.body;
    if (!clientName || !rating) return res.status(400).json({ error: "Missing fields" });

    db.run(
        "INSERT INTO reviews (clientName, rating, comment, approved) VALUES (?, ?, ?, 0)",
        [clientName, rating, comment || ""],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, success: true });
        }
    );
};

// -- GET /api/bookings/blocked-slots
export const getBlockedSlots = (req: Request, res: Response) => {
    const barberId = Number(req.query.barberId);
    const date = req.query.date as string;

    if (!barberId || !date) {
        return res.status(400).json({ error: "barberId and date required" });
    }

    // Define a search window: +/- 24h around the requested date
    const requestedDate = new Date(date);
    const prevDay = new Date(requestedDate.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const nextDay = new Date(requestedDate.getTime() + 48 * 60 * 60 * 1000).toISOString(); // +48h covers requested day + next

    const sql = `
    SELECT startAt, endAt FROM bookings
    WHERE barberId=?
      AND status IN ('pending','confirmed')
      AND (startAt < ? AND endAt > ?)
  `;

    db.all(sql, [barberId, nextDay, prevDay], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

// -- GET /api/bookings/:code
export const getBookingByCode = (req: Request, res: Response) => {
    const { code } = req.params;
    const sql = `
    SELECT b.*, s.title as serviceTitle, br.name as barberName
    FROM bookings b
    LEFT JOIN services s ON b.serviceId = s.id
    LEFT JOIN barbers br ON b.barberId = br.id
    WHERE b.code = ?
  `;
    db.get(sql, [code], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Booking not found" });
        res.json(row);
    });
};

// -- POST /api/bookings
export const createBooking = (req: Request, res: Response) => {
    const { clientName, clientPhone, serviceId, barberId, date, time, note } = req.body;

    if (!clientName || !clientPhone || !serviceId || !barberId || !date || !time) {
        return res.status(400).json({ error: "Missing fields" });
    }

    // 1. Get Service Duration
    db.get("SELECT durationMin FROM services WHERE id=?", [serviceId], (err, row: any) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Service not found" });

        const duration = row.durationMin;
        const startAt = toISODateTime(date, time);
        const endAt = addMinutes(startAt, duration);

        // 2. Check Overlap
        const checkSql = `
      SELECT id FROM bookings
      WHERE barberId=?
        AND status IN ('pending','confirmed')
        AND (startAt < ? AND endAt > ?)
    `;
        db.get(checkSql, [barberId, endAt, startAt], (err2, conflict) => {
            if (err2) return res.status(500).json({ error: err2.message });
            if (conflict) return res.status(409).json({ error: "Slot already taken" });

            // 3. Insert
            const code = generateBookingCode();
            const insertSql = `
        INSERT INTO bookings (code, clientName, clientPhone, barberId, serviceId, startAt, endAt, note, status)
        VALUES (?,?,?,?,?,?,?,?,'pending')
      `;
            db.run(insertSql, [code, clientName, clientPhone, barberId, serviceId, startAt, endAt, note || ""], function (err3) {
                if (err3) return res.status(500).json({ error: err3.message });
                res.status(201).json({ id: this.lastID, code });
            });
        });
    });
};
