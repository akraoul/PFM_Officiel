import db from "../db.js";
import { pushHistory } from "../utils/helpers.js";
// -- GET /api/admin/promotions
export const getPromotionsAdmin = (_req, res) => {
    db.all("SELECT * FROM promotions ORDER BY createdAt DESC", [], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};
// -- GET /api/admin/reviews
export const getReviewsAdmin = (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    db.get("SELECT COUNT(*) as count FROM reviews", [], (err, row) => {
        if (err)
            return res.status(500).json({ error: err.message });
        const totalItems = row.count;
        const totalPages = Math.ceil(totalItems / limit);
        db.all("SELECT *, approved as isApproved FROM reviews ORDER BY createdAt DESC LIMIT ? OFFSET ?", [limit, offset], (err2, rows) => {
            if (err2)
                return res.status(500).json({ error: err2.message });
            res.json({
                page,
                totalPages,
                totalItems,
                items: rows
            });
        });
    });
};
export const setReviewNote = (req, res) => {
    const { id } = req.params;
    const { adminNote } = req.body;
    db.run("UPDATE reviews SET adminNote=? WHERE id=?", [adminNote, id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
};
export const approveReview = (req, res) => {
    const { id } = req.params;
    const { isApproved } = req.body; // Frontend sends isApproved (0 or 1)
    const approved = isApproved;
    db.run("UPDATE reviews SET approved=? WHERE id=?", [approved, id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
};
// -- GET /api/admin/bookings/stats
export const getDashboardStats = (_req, res) => {
    // Frontend expects: today, week, month, pending
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    // Reset 'now' to avoid issues with setDate modifying the original date object for subsequent calculations
    const nowForWeek = new Date();
    const startOfWeek = new Date(nowForWeek.setDate(nowForWeek.getDate() - nowForWeek.getDay())).toISOString();
    const nowForMonth = new Date();
    const startOfMonth = new Date(nowForMonth.getFullYear(), nowForMonth.getMonth(), 1).toISOString();
    const sqlPending = "SELECT COUNT(*) as c FROM bookings WHERE status='pending'";
    const sqlToday = `SELECT COUNT(*) as c FROM bookings WHERE startAt >= '${startOfDay}'`;
    const sqlWeek = `SELECT COUNT(*) as c FROM bookings WHERE startAt >= '${startOfWeek}'`;
    const sqlMonth = `SELECT COUNT(*) as c FROM bookings WHERE startAt >= '${startOfMonth}'`;
    db.get(sqlPending, (e1, r1) => {
        if (e1)
            return res.status(500).json({ error: e1.message });
        db.get(sqlToday, (e2, r2) => {
            if (e2)
                return res.status(500).json({ error: e2.message });
            db.get(sqlWeek, (e3, r3) => {
                if (e3)
                    return res.status(500).json({ error: e3.message });
                db.get(sqlMonth, (e4, r4) => {
                    if (e4)
                        return res.status(500).json({ error: e4.message });
                    res.json({
                        pending: r1?.c || 0,
                        today: r2?.c || 0,
                        week: r3?.c || 0,
                        month: r4?.c || 0
                    });
                });
            });
        });
    });
};
// -- GET /api/admin/bookings
export const getBookings = (req, res) => {
    const { date, status, barberId, q } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    let baseSql = `
    FROM bookings b
    LEFT JOIN services s ON b.serviceId = s.id
    LEFT JOIN barbers br ON b.barberId = br.id
    WHERE 1=1
  `;
    const params = [];
    if (date) {
        baseSql += " AND date(b.startAt) = date(?)";
        params.push(date);
    }
    if (status) {
        baseSql += " AND b.status = ?";
        params.push(status);
    }
    if (barberId) {
        baseSql += " AND b.barberId = ?";
        params.push(Number(barberId));
    }
    if (q && typeof q === 'string') {
        baseSql += " AND (b.code LIKE ? OR b.clientName LIKE ? OR b.clientPhone LIKE ?)";
        const search = `%${q}%`;
        params.push(search, search, search);
    }
    // 1. Count Total
    db.get(`SELECT COUNT(*) as count ${baseSql}`, params, (err, row) => {
        if (err)
            return res.status(500).json({ error: err.message });
        const totalItems = row.count;
        const totalPages = Math.ceil(totalItems / limit);
        // 2. Fetch Page
        const sql = `
      SELECT b.*, s.title as serviceTitle, br.name as barberName
      ${baseSql}
      ORDER BY b.startAt DESC
      LIMIT ? OFFSET ?
    `;
        db.all(sql, [...params, limit, offset], (err2, rows) => {
            if (err2)
                return res.status(500).json({ error: err2.message });
            res.json({
                items: rows,
                page,
                limit,
                total: totalItems,
                totalPages
            });
        });
    });
};
// -- PUT /api/admin/bookings/:id/status
export const updateBookingStatus = (req, res) => {
    const { id } = req.params;
    const { status, cancellationReason } = req.body; // 'confirmed', 'cancelled', 'completed'
    if (!["confirmed", "cancelled", "done", "pending"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
    }
    // 1. Get current booking
    db.get("SELECT * FROM bookings WHERE id=?", [id], (err, row) => {
        if (err)
            return res.status(500).json({ error: err.message });
        if (!row)
            return res.status(404).json({ error: "Not found" });
        // 2. If status is 'done', move to history and delete
        if (status === 'done') {
            const updated = { ...row, status: 'done' };
            pushHistory(updated, "status_change");
            db.run("DELETE FROM bookings WHERE id=?", [id], function (err2) {
                if (err2)
                    return res.status(500).json({ error: err2.message });
                res.json({ success: true, movedToHistory: true });
            });
        }
        else {
            // 3. Otherwise, update status normally
            const reason = status === 'cancelled' ? cancellationReason : null;
            db.run("UPDATE bookings SET status=?, cancellationReason=? WHERE id=?", [status, reason, id], function (err2) {
                if (err2)
                    return res.status(500).json({ error: err2.message });
                // 4. History
                const updated = { ...row, status, cancellationReason: reason };
                pushHistory(updated, "status_change");
                res.json({ success: true });
            });
        }
    });
};
// -- DELETE /api/admin/bookings/:id
export const deleteBooking = (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM bookings WHERE id=?", [id], (err, row) => {
        if (err)
            return res.status(500).json({ error: err.message });
        if (!row)
            return res.status(404).json({ error: "Not found" });
        db.run("DELETE FROM bookings WHERE id=?", [id], function (err2) {
            if (err2)
                return res.status(500).json({ error: err2.message });
            pushHistory(row, "deleted");
            res.json({ success: true });
        });
    });
};
// -- SERVICES CRUD --
export const getServicesAdmin = (_req, res) => {
    db.all("SELECT * FROM services ORDER BY createdAt DESC", [], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};
export const createService = (req, res) => {
    const { title, durationMin, price, category } = req.body;
    const photo = req.file ? `/uploads/services/${req.file.filename}` : null;
    db.run("INSERT INTO services (title, durationMin, price, category, photo) VALUES (?,?,?,?,?)", [title, durationMin, price, category, photo], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, success: true });
    });
};
export const updateService = (req, res) => {
    const { id } = req.params;
    const { title, durationMin, price, category, isActive } = req.body;
    const sql = `UPDATE services SET title=COALESCE(?,title), durationMin=COALESCE(?,durationMin), price=COALESCE(?,price), category=COALESCE(?,category), isActive=COALESCE(?,isActive) WHERE id=?`;
    db.run(sql, [title, durationMin, price, category, isActive, id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ changed: this.changes });
    });
};
export const deleteService = (req, res) => {
    db.run("DELETE FROM services WHERE id=?", [req.params.id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
};
// -- BARBERS CRUD --
export const getBarbersAdmin = (_req, res) => {
    db.all("SELECT * FROM barbers ORDER BY createdAt DESC", [], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};
export const createBarber = (req, res) => {
    const { name, role } = req.body;
    const photo = req.file ? `/uploads/barbers/${req.file.filename}` : null;
    db.run("INSERT INTO barbers (name, role, photo) VALUES (?,?,?)", [name, role, photo], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, success: true });
    });
};
export const updateBarber = (req, res) => {
    const { id } = req.params;
    const { name, role, isActive } = req.body;
    const sql = `UPDATE barbers SET name=COALESCE(?,name), role=COALESCE(?,role), isActive=COALESCE(?,isActive) WHERE id=?`;
    db.run(sql, [name, role, isActive, id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ changed: this.changes });
    });
};
export const deleteBarber = (req, res) => {
    db.run("DELETE FROM barbers WHERE id=?", [req.params.id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
};
// -- GALLERY CRUD --
export const getGalleryAdmin = (_req, res) => {
    db.all("SELECT * FROM gallery ORDER BY createdAt DESC", [], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};
export const uploadGallery = (req, res) => {
    const photo = req.file ? `/uploads/gallery/${req.file.filename}` : null;
    if (!photo)
        return res.status(400).json({ error: "No file" });
    db.run("INSERT INTO gallery (photo) VALUES (?)", [photo], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, success: true });
    });
};
export const updateGallery = (req, res) => {
    const { id } = req.params;
    const { isActive, caption } = req.body; // Assuming caption exists or just active toggle
    db.run("UPDATE gallery SET isActive=COALESCE(?,isActive) WHERE id=?", [isActive, id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ changed: this.changes });
    });
};
export const deleteGallery = (req, res) => {
    db.run("DELETE FROM gallery WHERE id=?", [req.params.id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
};
// -- PROMOTIONS CRUD --
export const createPromotion = (req, res) => {
    const { title, description, expiresAt, discountPercent } = req.body;
    const price = discountPercent || 0;
    const photo = req.file ? `/uploads/promotions/${req.file.filename}` : null;
    db.run("INSERT INTO promotions (title, description, photo, expiresAt, price) VALUES (?,?,?,?,?)", [title, description, photo, expiresAt || null, price], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, success: true });
    });
};
export const updatePromotion = (req, res) => {
    const { id } = req.params;
    const { title, description, expiresAt, isActive, discountPercent } = req.body;
    const price = discountPercent;
    const sql = `UPDATE promotions SET title=COALESCE(?,title), description=COALESCE(?,description), expiresAt=COALESCE(?,expiresAt), isActive=COALESCE(?,isActive), price=COALESCE(?,price) WHERE id=?`;
    db.run(sql, [title, description, expiresAt, isActive, price, id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ changed: this.changes });
    });
};
export const deletePromotion = (req, res) => {
    db.run("DELETE FROM promotions WHERE id=?", [req.params.id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
};
// -- REVIEWS ADMIN --
// (Removed duplicate approveReview)
export const deleteReview = (req, res) => {
    db.run("DELETE FROM reviews WHERE id=?", [req.params.id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
};
// -- BOOKINGS HISTORY --
export const getBookingsHistory = (req, res) => {
    const { q } = req.query;
    let sql = `
        SELECT bh.*, s.title as serviceTitle, b.name as barberName
        FROM booking_history bh
        LEFT JOIN services s ON bh.serviceId = s.id
        LEFT JOIN barbers b ON bh.barberId = b.id
    `;
    const params = [];
    if (q && typeof q === 'string') {
        sql += ` WHERE bh.code LIKE ? OR bh.clientName LIKE ? OR bh.clientPhone LIKE ?`;
        const search = `%${q}%`;
        params.push(search, search, search);
    }
    sql += ` ORDER BY bh.actionAt DESC LIMIT 100`;
    db.all(sql, params, (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};
// -- BARBER AVAILABILITY --
export const getBarberAvailability = (req, res) => {
    const { barberId } = req.params;
    db.all("SELECT * FROM barber_availability WHERE barberId = ? ORDER BY startDate ASC", [barberId], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};
export const createBarberAvailability = (req, res) => {
    const { barberId } = req.params;
    const { startDate, endDate, reason } = req.body;
    if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
    }
    db.run("INSERT INTO barber_availability (barberId, startDate, endDate, reason) VALUES (?, ?, ?, ?)", [barberId, startDate, endDate, reason || null], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, success: true });
    });
};
export const updateBarberAvailability = (req, res) => {
    const { id } = req.params;
    const { startDate, endDate, reason } = req.body;
    db.run("UPDATE barber_availability SET startDate = COALESCE(?, startDate), endDate = COALESCE(?, endDate), reason = COALESCE(?, reason) WHERE id = ?", [startDate, endDate, reason, id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ changed: this.changes });
    });
};
export const deleteBarberAvailability = (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM barber_availability WHERE id = ?", [id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
};
