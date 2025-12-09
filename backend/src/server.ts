import "dotenv/config";
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import clientRoutes from './routes/client.js';
import adminRoutes from './routes/admin.js';

// -- CONFIG --
const app = express();
const PORT = 3000;

// -- MIDDLEWARE --
app.use(cors());
app.use(express.json());

// -- STATIC FILES --
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// -- ROUTES --
app.use('/api', clientRoutes);
app.use('/api/admin', adminRoutes);

// -- START --
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
