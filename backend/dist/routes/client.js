import { Router } from "express";
import * as Client from "../controllers/clientController.js";
const router = Router();
// Public data
router.get("/services", Client.getServices);
router.get("/barbers", Client.getBarbers);
router.get("/gallery", Client.getGallery);
router.get("/promotions", Client.getPromotions);
router.get("/reviews", Client.getReviews);
// Validation
router.get("/bookings/blocked-slots", Client.getBlockedSlots);
router.get("/bookings/:code", Client.getBookingByCode);
// Actions
router.post("/bookings", Client.createBooking);
router.post("/reviews", Client.createReview);
export default router;
