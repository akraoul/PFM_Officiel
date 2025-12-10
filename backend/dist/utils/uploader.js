import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { fileURLToPath } from "url";
// Resolve __dirname shim for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Ensure upload dirs exist
export const uploadDirs = {
    barbers: path.join(__dirname, "../../uploads", "barbers"),
    services: path.join(__dirname, "../../uploads", "services"),
    gallery: path.join(__dirname, "../../uploads", "gallery"),
    promotions: path.join(__dirname, "../../uploads", "promotions"),
};
// Create folders if needed
Object.values(uploadDirs).forEach((dir) => {
    fs.mkdirSync(dir, { recursive: true });
});
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
export const uploader = {
    barber: multer({ storage: makeStorage(uploadDirs.barbers) }),
    service: multer({ storage: makeStorage(uploadDirs.services) }),
    gallery: multer({ storage: makeStorage(uploadDirs.gallery) }),
    promo: multer({ storage: makeStorage(uploadDirs.promotions) }),
};
