import { Router } from "express";
import * as Admin from "../controllers/adminController.js";
import * as Auth from "../controllers/authController.js";
import { uploader } from "../utils/uploader.js";

const router = Router();

// Public Auth
router.post("/login", Auth.login);

// Protected Middleware
router.use(Auth.requireAuth);

// Stats
router.get("/bookings/stats", Admin.getDashboardStats); // Fixed path to match frontend

// Bookings
router.get("/bookings", Admin.getBookings);
router.put("/bookings/:id/status", Admin.updateBookingStatus);
router.delete("/bookings/:id", Admin.deleteBooking);

// Services
router.get("/services", Admin.getServicesAdmin);
router.post("/services", uploader.service.single("photo"), Admin.createService);
router.put("/services/:id", Admin.updateService);
router.delete("/services/:id", Admin.deleteService);

// Barbers
router.get("/barbers", Admin.getBarbersAdmin);
router.post("/barbers", uploader.barber.single("photo"), Admin.createBarber);
router.put("/barbers/:id", Admin.updateBarber);
router.delete("/barbers/:id", Admin.deleteBarber);

// Gallery
router.get("/gallery", Admin.getGalleryAdmin);
router.post("/gallery", uploader.gallery.single("photo"), Admin.uploadGallery);
router.put("/gallery/:id", Admin.updateGallery);
router.delete("/gallery/:id", Admin.deleteGallery);

// Promotions
router.get("/promotions", Admin.getPromotionsAdmin);
router.post("/promotions", uploader.promo.single("photo"), Admin.createPromotion);
router.put("/promotions/:id", Admin.updatePromotion);
router.delete("/promotions/:id", Admin.deletePromotion);

// Reviews
router.get("/reviews", Admin.getReviewsAdmin); // Need admin specific listing?
router.patch("/reviews/:id/approve", Admin.approveReview); // Frontend calls via PUT /reviews/:id/approve ? Checked api: PUT /reviews/:id/approve
router.put("/reviews/:id/note", Admin.setReviewNote);
router.delete("/reviews/:id", Admin.deleteReview);

export default router;
