import "dotenv/config";
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import clientRoutes from './routes/client.js';
import adminRoutes from './routes/admin.js';
// -- CONFIG --
const app = express();
const PORT = Number(process.env.PORT) || 3000;
// -- MIDDLEWARE --
app.use(cors());
app.use(express.json());
// -- STATIC FILES --
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// In production (dist/server.js), uploads is at dist/uploads
const uploadsPath = process.env.NODE_ENV === 'production'
    ? path.join(__dirname, '../uploads')
    : path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));
// -- ROUTES --
app.use('/api', clientRoutes);
app.use('/api/admin', adminRoutes);
// -- START --
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
