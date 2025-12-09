import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";
import db from "./db.js";
import { adminOnly } from "./middleware.js";
// -------------------------
// RESOLVE __dirname (ESM)
// -------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// -------------------------
// DOTENV: always load backend/.env
// -------------------------
dotenv.config({ path: path.join(__dirname, "../.env") });
// -------------------------
// APP SETUP
// -------------------------
const app = express();
app.use(cors());
app.use(express.json());
// -------------------------
// UPLOADS + MULTER
// -------------------------
function makeStorage(dest) {
    return multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, dest),
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname);
            const name = crypto.randomBytes(8).toString("hex");
            cb(null, `${name}${ext}`);
        }
    });
}
// folders
const barbersDir = path.join(__dirname, "../uploads", "barbers");
const servicesDir = path.join(__dirname, "../uploads", "services");
const galleryDir = path.join(__dirname, "../uploads", "gallery");
const promotionsDir = path.join(__dirname, "../uploads", "promotions");
fs.mkdirSync(barbersDir, { recursive: true });
fs.mkdirSync(servicesDir, { recursive: true });
fs.mkdirSync(galleryDir, { recursive: true });
fs.mkdirSync(promotionsDir, { recursive: true });
// uploaders
const uploadBarber = multer({ storage: makeStorage(barbersDir) });
const uploadService = multer({ storage: makeStorage(servicesDir) });
const uploadGallery = multer({ storage: makeStorage(galleryDir) });
const uploadPromo = multer({ storage: makeStorage(promotionsDir) });
// -------------------------
// HELPERS
// -------------------------
function generateBookingCode() {
    const part = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `PFM-${part}`;
}
function toISODateTime(date, time) {
    return new Date(`${date}T${time}:00`).toISOString();
}
function addMinutes(iso, minutes) {
    return new Date(new Date(iso).getTime() + minutes * 60000).toISOString();
}
function pushHistory(booking, action) {
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
// -------------------------
// STATIC
// -------------------------
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/", express.static(path.join(__dirname, "../public")));
// =======================================================
// CLIENT ROUTES
// =======================================================
// Active services
app.get("/api/services", (_req, res) => {
    db.all("SELECT * FROM services WHERE isActive=1 ORDER BY category,title", [], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
// Active barbers
app.get("/api/barbers", (_req, res) => {
    db.all("SELECT * FROM barbers WHERE isActive=1 ORDER BY name", [], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
// Active gallery
app.get("/api/gallery", (_req, res) => {
    db.all("SELECT * FROM gallery WHERE isActive=1 ORDER BY createdAt DESC", [], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
// Promotions actives + non expirées
app.get("/api/promotions", (_req, res) => {
    db.all(`
    SELECT * FROM promotions
    WHERE isActive=1
      AND (expiresAt IS NULL OR expiresAt > datetime('now'))
    ORDER BY id DESC
    `, [], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
// Reviews approuvées PAGINÉES (client)
// GET /api/reviews?page=1&limit=6
app.get("/api/reviews", (req, res) => {
    const { page = "1", limit = "6" } = req.query;
    const p = Math.max(1, Number(page));
    const l = Math.min(30, Math.max(1, Number(limit)));
    const offset = (p - 1) * l;
    db.all(`
    SELECT id, clientName, rating, comment, createdAt
    FROM reviews
    WHERE isApproved=1
    ORDER BY createdAt DESC
    LIMIT ? OFFSET ?
    `, [l, offset], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        db.get("SELECT COUNT(*) as total FROM reviews WHERE isApproved=1", [], (errC, countRow) => {
            if (errC)
                return res.status(500).json({ error: errC.message });
            res.json({
                items: rows,
                page: p,
                limit: l,
                total: countRow.total,
                totalPages: Math.ceil(countRow.total / l)
            });
        });
    });
});
// Create review (pending)
app.post("/api/reviews", (req, res) => {
    const { clientName, rating, comment } = req.body;
    if (!clientName || !rating || !comment) {
        return res.status(400).json({ error: "Missing fields" });
    }
    const safeRating = Math.min(5, Math.max(1, Number(rating)));
    db.run("INSERT INTO reviews (clientName, rating, comment, isApproved) VALUES (?,?,?,0)", [clientName, safeRating, comment], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, status: "pending_approval" });
    });
});
// Create booking with collision lock
app.post("/api/bookings", (req, res) => {
    const { clientName, clientPhone, barberId, serviceId, date, time, note, peopleCount = 1 } = req.body;
    if (!clientName || !clientPhone || !barberId || !serviceId || !date || !time) {
        return res.status(400).json({ error: "Missing fields" });
    }
    db.get("SELECT durationMin FROM services WHERE id=? AND isActive=1", [serviceId], (errS, serviceRow) => {
        if (errS)
            return res.status(500).json({ error: errS.message });
        if (!serviceRow)
            return res.status(400).json({ error: "Invalid service" });
        const durationMin = Number(serviceRow.durationMin) * Number(peopleCount);
        const startAt = toISODateTime(date, time);
        const endAt = addMinutes(startAt, durationMin);
        // collision check
        db.get(`
        SELECT id FROM bookings
        WHERE barberId=?
          AND status IN ('pending','confirmed')
          AND NOT (endAt<=? OR startAt>=?)
        `, [barberId, startAt, endAt], (errC, conflict) => {
            if (errC)
                return res.status(500).json({ error: errC.message });
            if (conflict)
                return res.status(409).json({ error: "Time slot not available" });
            const code = generateBookingCode();
            db.run(`
            INSERT INTO bookings
            (code, clientName, clientPhone, barberId, serviceId, startAt, endAt, peopleCount, note, status)
            VALUES (?,?,?,?,?,?,?,?,?, 'pending')
            `, [
                code,
                clientName,
                clientPhone,
                barberId,
                serviceId,
                startAt,
                endAt,
                peopleCount,
                note ?? null
            ], function (errI) {
                if (errI)
                    return res.status(500).json({ error: errI.message });
                res.json({ id: this.lastID, code });
            });
        });
    });
});
// Lookup booking by code
app.get("/api/bookings/:code", (req, res) => {
    const { code } = req.params;
    db.get(`
    SELECT b.*, s.title as serviceTitle, br.name as barberName
    FROM bookings b
    JOIN services s ON s.id=b.serviceId
    JOIN barbers br ON br.id=b.barberId
    WHERE b.code=?
    `, [code], (err, row) => {
        if (err)
            return res.status(500).json({ error: err.message });
        if (!row)
            return res.status(404).json({ error: "Not found" });
        res.json(row);
    });
});
// Blocked slots for day/barber
app.get("/api/bookings/blocked-slots", (req, res) => {
    const { barberId, date } = req.query;
    if (!barberId || !date) {
        return res.status(400).json({ error: "barberId & date required" });
    }
    const dayStart = new Date(`${date}T00:00:00`).toISOString();
    const dayEnd = new Date(`${date}T23:59:59`).toISOString();
    db.all(`
    SELECT startAt, endAt FROM bookings
    WHERE barberId=?
      AND status IN ('pending','confirmed')
      AND startAt BETWEEN ? AND ?
    `, [barberId, dayStart, dayEnd], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
// =======================================================
// ADMIN ROUTES
// =======================================================
// =======================
// ADMIN AUTH
// =======================
app.post("/api/admin/login", (req, res) => {
    const envToken = String(process.env.ADMIN_TOKEN ?? "").trim();
    const clientToken = String(req.body?.token ?? "").trim();
    // debug utile (tu peux enlever après)
    console.log("[admin/login]", { clientToken, envToken });
    if (!envToken) {
        return res.status(500).json({
            ok: false,
            error: "ADMIN_TOKEN is missing in .env"
        });
    }
    if (clientToken === envToken) {
        return res.json({ ok: true });
    }
    return res.status(401).json({ ok: false });
});
// -------------------------
// SERVICES CRUD + UPLOAD
// -------------------------
app.get("/api/admin/services", adminOnly, (_req, res) => {
    db.all("SELECT * FROM services ORDER BY category,title", [], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.post("/api/admin/services", adminOnly, uploadService.single("photo"), (req, res) => {
    const { title, category, price, durationMin } = req.body;
    const file = req.file;
    const photoPath = file ? `/uploads/services/${file.filename}` : null;
    if (!title || !category || price == null || durationMin == null) {
        return res.status(400).json({ error: "Missing fields" });
    }
    db.run("INSERT INTO services (title, category, price, durationMin, photo, isActive) VALUES (?,?,?,?,?,1)", [title, category, price, durationMin, photoPath], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, photo: photoPath });
    });
});
app.put("/api/admin/services/:id", adminOnly, (req, res) => {
    const id = Number(req.params.id);
    const { title, category, price, durationMin, photo, isActive } = req.body;
    db.run(`
    UPDATE services 
    SET title=?, category=?, price=?, durationMin=?, photo=COALESCE(?, photo), isActive=? 
    WHERE id=?
    `, [title, category, price, durationMin, photo ?? null, isActive ?? 1, id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ changed: this.changes });
    });
});
app.delete("/api/admin/services/:id", adminOnly, (req, res) => {
    const id = Number(req.params.id);
    db.run("DELETE FROM services WHERE id=?", [id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});
// -------------------------
// BARBERS CRUD + UPLOAD
// -------------------------
app.post("/api/admin/barbers", adminOnly, uploadBarber.single("photo"), (req, res) => {
    const { name, role } = req.body;
    const file = req.file;
    if (!name || !file)
        return res.status(400).json({ error: "Missing fields" });
    const photoPath = `/uploads/barbers/${file.filename}`;
    db.run("INSERT INTO barbers (name, photo, role, isActive) VALUES (?,?,?,1)", [name, photoPath, role ?? "Барбер"], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, photo: photoPath });
    });
});
app.get("/api/admin/barbers", adminOnly, (_req, res) => {
    db.all("SELECT * FROM barbers ORDER BY name", [], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.put("/api/admin/barbers/:id", adminOnly, (req, res) => {
    const id = Number(req.params.id);
    const { name, role, isActive, photo } = req.body;
    db.run(`
    UPDATE barbers
    SET name=?, role=?, isActive=?, photo=COALESCE(?, photo)
    WHERE id=?
    `, [name, role, isActive ?? 1, photo ?? null, id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ changed: this.changes });
    });
});
app.delete("/api/admin/barbers/:id", adminOnly, (req, res) => {
    const id = Number(req.params.id);
    db.run("DELETE FROM barbers WHERE id=?", [id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});
// -------------------------
// GALLERY CRUD + UPLOAD
// -------------------------
app.get("/api/admin/gallery", adminOnly, (_req, res) => {
    db.all("SELECT * FROM gallery ORDER BY createdAt DESC", [], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.post("/api/admin/gallery", adminOnly, uploadGallery.single("photo"), (req, res) => {
    const { caption } = req.body;
    const file = req.file;
    if (!file)
        return res.status(400).json({ error: "photo missing" });
    const photoPath = `/uploads/gallery/${file.filename}`;
    db.run("INSERT INTO gallery (photo, caption, isActive) VALUES (?,?,1)", [photoPath, caption ?? null], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, photo: photoPath });
    });
});
app.put("/api/admin/gallery/:id", adminOnly, (req, res) => {
    const id = Number(req.params.id);
    const { caption, isActive } = req.body;
    db.run("UPDATE gallery SET caption=?, isActive=? WHERE id=?", [caption ?? null, isActive ?? 1, id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ changed: this.changes });
    });
});
app.delete("/api/admin/gallery/:id", adminOnly, (req, res) => {
    const id = Number(req.params.id);
    db.run("DELETE FROM gallery WHERE id=?", [id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});
// -------------------------
// ADMIN BOOKINGS (paged + filters)
// -------------------------
app.get("/api/admin/bookings", adminOnly, (req, res) => {
    const { page = "1", limit = "12", date, barberId, status = "all", q = "" } = req.query;
    const p = Math.max(1, Number(page));
    const l = Math.min(50, Math.max(1, Number(limit)));
    const offset = (p - 1) * l;
    const where = [];
    const params = [];
    if (date) {
        const dayStart = new Date(`${date}T00:00:00`).toISOString();
        const dayEnd = new Date(`${date}T23:59:59`).toISOString();
        where.push("b.startAt BETWEEN ? AND ?");
        params.push(dayStart, dayEnd);
    }
    if (barberId) {
        where.push("b.barberId=?");
        params.push(Number(barberId));
    }
    if (status !== "all") {
        where.push("b.status=?");
        params.push(status);
    }
    if (q) {
        where.push(`(
      LOWER(b.clientName) LIKE ?
      OR LOWER(b.clientPhone) LIKE ?
      OR LOWER(b.code) LIKE ?
      OR LOWER(br.name) LIKE ?
      OR LOWER(s.title) LIKE ?
    )`);
        const like = `%${String(q).toLowerCase()}%`;
        params.push(like, like, like, like, like);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    db.all(`
    SELECT b.*, s.title as serviceTitle, br.name as barberName
    FROM bookings b
    JOIN services s ON s.id=b.serviceId
    JOIN barbers br ON br.id=b.barberId
    ${whereSql}
    ORDER BY b.startAt DESC
    LIMIT ? OFFSET ?
    `, [...params, l, offset], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        db.get(`
        SELECT COUNT(*) as total
        FROM bookings b
        JOIN services s ON s.id=b.serviceId
        JOIN barbers br ON br.id=b.barberId
        ${whereSql}
        `, params, (errC, countRow) => {
            if (errC)
                return res.status(500).json({ error: errC.message });
            res.json({
                items: rows,
                page: p,
                limit: l,
                total: countRow.total,
                totalPages: Math.ceil(countRow.total / l)
            });
        });
    });
});
// Update booking status + history
app.put("/api/admin/bookings/:id/status", adminOnly, (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!["pending", "confirmed", "cancelled", "done"].includes(status)) {
        return res.status(400).json({ error: "invalid status" });
    }
    db.get("SELECT * FROM bookings WHERE id=?", [id], (errG, booking) => {
        if (errG)
            return res.status(500).json({ error: errG.message });
        if (!booking)
            return res.status(404).json({ error: "not found" });
        db.run("UPDATE bookings SET status=? WHERE id=?", [status, id], function (errU) {
            if (errU)
                return res.status(500).json({ error: errU.message });
            pushHistory(booking, "status_change");
            res.json({ changed: this.changes });
        });
    });
});
// Delete booking + history
app.delete("/api/admin/bookings/:id", adminOnly, (req, res) => {
    const id = Number(req.params.id);
    db.get("SELECT * FROM bookings WHERE id=?", [id], (errG, booking) => {
        if (errG)
            return res.status(500).json({ error: errG.message });
        if (!booking)
            return res.status(404).json({ error: "not found" });
        db.run("DELETE FROM bookings WHERE id=?", [id], function (errD) {
            if (errD)
                return res.status(500).json({ error: errD.message });
            pushHistory(booking, "deleted");
            res.json({ deleted: this.changes });
        });
    });
});
// Booking stats
app.get("/api/admin/bookings/stats", adminOnly, (_req, res) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);
    const weekStartIso = weekStart.toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    db.get(`
    SELECT
      (SELECT COUNT(*) FROM bookings WHERE startAt BETWEEN ? AND ?) as today,
      (SELECT COUNT(*) FROM bookings WHERE startAt >= ?) as week,
      (SELECT COUNT(*) FROM bookings WHERE startAt >= ?) as month,
      (SELECT COUNT(*) FROM bookings WHERE status='pending') as pending
    `, [todayStart, tomorrowStart, weekStartIso, monthStart], (err, row) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json(row);
    });
});
// Export bookings CSV
app.get("/api/admin/bookings/export.csv", adminOnly, (_req, res) => {
    db.all(`
    SELECT b.code, b.clientName, b.clientPhone, br.name as barberName,
           s.title as serviceTitle, b.startAt, b.endAt, b.peopleCount, b.status, b.note
    FROM bookings b
    JOIN services s ON s.id=b.serviceId
    JOIN barbers br ON br.id=b.barberId
    ORDER BY b.startAt DESC
    `, [], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        const header = [
            "code", "clientName", "clientPhone", "barberName", "serviceTitle",
            "startAt", "endAt", "peopleCount", "status", "note"
        ];
        const csv = [
            header.join(","),
            ...rows.map(r => header.map(h => JSON.stringify(r[h] ?? "")).join(","))
        ].join("\n");
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", "attachment; filename=bookings.csv");
        res.send(csv);
    });
});
// History list
app.get("/api/admin/bookings/history", adminOnly, (req, res) => {
    const { q } = req.query;
    const where = [];
    const params = [];
    if (q) {
        where.push(`(
      LOWER(clientName) LIKE ?
      OR LOWER(clientPhone) LIKE ?
      OR LOWER(code) LIKE ?
    )`);
        const like = `%${String(q).toLowerCase()}%`;
        params.push(like, like, like);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    db.all(`
    SELECT * FROM booking_history
    ${whereSql}
    ORDER BY actionAt DESC
    LIMIT 500
    `, params, (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
// =======================
// ADMIN PROMOTIONS (description NOT NULL safe)
// discountPercent stocké dans price
// =======================
app.get("/api/admin/promotions", adminOnly, (_req, res) => {
    db.all("SELECT * FROM promotions ORDER BY id DESC", [], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.post("/api/admin/promotions", adminOnly, uploadPromo.single("photo"), (req, res) => {
    const { title, description, expiresAt, discountPercent } = req.body;
    const file = req.file;
    const photoPath = file ? `/uploads/promotions/${file.filename}` : null;
    if (!title || !title.trim()) {
        return res.status(400).json({ error: "title missing" });
    }
    // ✅ description obligatoire dans ta DB => fallback ""
    const safeDescription = (description ?? "").trim();
    // ✅ discountPercent obligatoire (0..100) stocké dans price
    const dp = Number(discountPercent);
    if (Number.isNaN(dp)) {
        return res.status(400).json({ error: "discountPercent required" });
    }
    const safeDp = Math.min(100, Math.max(0, dp));
    db.run(`
      INSERT INTO promotions (title, description, photo, expiresAt, price, isActive)
      VALUES (?,?,?,?,?,1)
      `, [
        title.trim(),
        safeDescription, // ✅ jamais null
        photoPath,
        expiresAt ?? null,
        safeDp
    ], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, photo: photoPath });
    });
});
app.put("/api/admin/promotions/:id", adminOnly, (req, res) => {
    const id = Number(req.params.id);
    const { title, description, photo, expiresAt, discountPercent, isActive } = req.body;
    if (!title || !title.trim()) {
        return res.status(400).json({ error: "title missing" });
    }
    const safeDescription = (description ?? "").trim(); // ✅ jamais null
    const dp = discountPercent !== undefined ? Number(discountPercent) : undefined;
    if (discountPercent !== undefined && Number.isNaN(dp)) {
        return res.status(400).json({ error: "invalid discountPercent" });
    }
    const safeDp = dp !== undefined ? Math.min(100, Math.max(0, dp)) : undefined;
    db.run(`
    UPDATE promotions
    SET title=?,
        description=?,                 -- ✅ toujours string
        photo=COALESCE(?, photo),
        expiresAt=?,
        price=COALESCE(?, price),
        isActive=?
    WHERE id=?
    `, [
        title.trim(),
        safeDescription, // ✅ toujours string
        photo ?? null,
        expiresAt ?? null,
        safeDp ?? null,
        isActive ?? 1,
        id
    ], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ changed: this.changes });
    });
});
app.delete("/api/admin/promotions/:id", adminOnly, (req, res) => {
    const id = Number(req.params.id);
    db.run("DELETE FROM promotions WHERE id=?", [id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});
// -------------------------
// ADMIN REVIEWS V2
// -------------------------
app.get("/api/admin/reviews", adminOnly, (req, res) => {
    const { page = "1", limit = "10", status = "all", q = "" } = req.query;
    const p = Math.max(1, Number(page));
    const l = Math.min(50, Math.max(1, Number(limit)));
    const offset = (p - 1) * l;
    const where = [];
    const params = [];
    if (status !== "all") {
        where.push("isApproved=?");
        params.push(status === "approved" ? 1 : 0);
    }
    if (q) {
        where.push(`(
      LOWER(clientName) LIKE ?
      OR LOWER(comment) LIKE ?
    )`);
        const like = `%${String(q).toLowerCase()}%`;
        params.push(like, like);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    db.all(`
    SELECT * FROM reviews
    ${whereSql}
    ORDER BY createdAt DESC
    LIMIT ? OFFSET ?
    `, [...params, l, offset], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        db.get(`SELECT COUNT(*) as total FROM reviews ${whereSql}`, params, (errC, countRow) => {
            if (errC)
                return res.status(500).json({ error: errC.message });
            res.json({
                items: rows,
                page: p,
                limit: l,
                total: countRow.total,
                totalPages: Math.ceil(countRow.total / l)
            });
        });
    });
});
// Approve / unapprove review
app.put("/api/admin/reviews/:id/approve", adminOnly, (req, res) => {
    const id = Number(req.params.id);
    const { isApproved } = req.body;
    db.run("UPDATE reviews SET isApproved=? WHERE id=?", [isApproved ?? 1, id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ changed: this.changes });
    });
});
// Admin private note
app.put("/api/admin/reviews/:id/note", adminOnly, (req, res) => {
    const id = Number(req.params.id);
    const { adminNote } = req.body;
    db.run("UPDATE reviews SET adminNote=? WHERE id=?", [adminNote ?? null, id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ changed: this.changes });
    });
});
// Delete review
app.delete("/api/admin/reviews/:id", adminOnly, (req, res) => {
    const id = Number(req.params.id);
    db.run("DELETE FROM reviews WHERE id=?", [id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});
// -------------------------
// START
// -------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on ${PORT}`));
