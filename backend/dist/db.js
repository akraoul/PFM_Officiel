// better-sqlite3
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "../pfm.db");
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
      isActive INTEGER DEFAULT 1
    )
  `);
    // barbers
    db.run(`
    CREATE TABLE IF NOT EXISTS barbers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'Барбер',
      photo TEXT NOT NULL,
      isActive INTEGER DEFAULT 1
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
    // promotions (si déjà existant chez toi)
    db.run(`
    CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      photo TEXT,
      isActive INTEGER DEFAULT 1
    )
  `);
    // reviews (si déjà existant chez toi)
    db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clientName TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      isApproved INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);
    // bookings
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
      status TEXT DEFAULT 'pending'
    )
  `);
    // booking history
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
});
export default db;
