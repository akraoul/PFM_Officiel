// better-sqlite3


import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In production (dist/server.js), database is at dist/pfm.db
const dbPath = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '../pfm.db')
  : path.join(__dirname, "../pfm.db");

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // services
  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      durationMin INTEGER NOT NULL,
      photo TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // barbers
  db.run(`
    CREATE TABLE IF NOT EXISTS barbers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'Барбер',
      photo TEXT NOT NULL,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // gallery
  db.run(`
    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      photo TEXT NOT NULL,
      caption TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // promotions
  db.run(`
    CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      photo TEXT,
      expiresAt TEXT,
      price INTEGER,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // reviews
  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clientName TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      approved INTEGER DEFAULT 0,
      adminNote TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // bookings ... (unchanged)
  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      clientName TEXT NOT NULL,
      clientPhone TEXT NOT NULL,
      barberId INTEGER NOT NULL,
      serviceId INTEGER NOT NULL,
      startAt TEXT NOT NULL,
      endAt TEXT NOT NULL,
      peopleCount INTEGER DEFAULT 1,
      note TEXT,
      status TEXT DEFAULT 'pending',
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // ... (history unchanged)
  db.run(`
    CREATE TABLE IF NOT EXISTS booking_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookingId INTEGER,
      code TEXT,
      clientName TEXT,
      clientPhone TEXT,
      barberId INTEGER,
      serviceId INTEGER,
      startAt TEXT,
      endAt TEXT,
      peopleCount INTEGER,
      note TEXT,
      status TEXT,
      action TEXT,
      actionAt TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_history_bookingId ON booking_history(bookingId)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_history_actionAt ON booking_history(actionAt)`);

  // barber_availability
  db.run(`
    CREATE TABLE IF NOT EXISTS barber_availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barberId INTEGER NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      reason TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (barberId) REFERENCES barbers(id) ON DELETE CASCADE
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_availability_barber ON barber_availability(barberId)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_availability_dates ON barber_availability(startDate, endDate)`);

  // -- MIGRATIONS (columns missing in old DB) --
  const migration = (sql: string) => {
    db.run(sql, function (err) {
      if (err && !err.message.includes("duplicate column name")) {
        console.error("Migration failed:", sql, err.message);
      }
    });
  };

  // Services
  migration("ALTER TABLE services ADD COLUMN createdAt TEXT");
  db.run("UPDATE services SET createdAt = datetime('now') WHERE createdAt IS NULL");

  // Barbers
  migration("ALTER TABLE barbers ADD COLUMN createdAt TEXT");
  db.run("UPDATE barbers SET createdAt = datetime('now') WHERE createdAt IS NULL");

  // Promotions
  migration("ALTER TABLE promotions ADD COLUMN expiresAt TEXT");
  migration("ALTER TABLE promotions ADD COLUMN createdAt TEXT");
  migration("ALTER TABLE promotions ADD COLUMN price INTEGER"); // Used as discountPercent in frontend
  db.run("UPDATE promotions SET createdAt = datetime('now') WHERE createdAt IS NULL");
  db.run("UPDATE promotions SET price = 0 WHERE price IS NULL");

  // Reviews
  migration("ALTER TABLE reviews ADD COLUMN adminNote TEXT");
  migration("ALTER TABLE reviews ADD COLUMN approved INTEGER DEFAULT 0"); // Constant default is OK

  // Bookings (just in case)
  migration("ALTER TABLE bookings ADD COLUMN createdAt TEXT");
  migration("ALTER TABLE bookings ADD COLUMN cancellationReason TEXT");
  db.run("UPDATE bookings SET createdAt = datetime('now') WHERE createdAt IS NULL");
});

export default db;
