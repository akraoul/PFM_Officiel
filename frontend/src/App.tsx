import { BrowserRouter, Routes, Route } from "react-router-dom";
import ClientLayout from "./layouts/ClientLayout";
import AdminLayout from "./layouts/AdminLayout";
import RequireAdmin from "./auth/RequireAdmin";

// client
import Home from "./pages/client/Home";
import Booking from "./pages/client/Booking";
import Gallery from "./pages/client/Gallery";
import CheckBooking from "./pages/client/CheckBooking";
import Promotions from "./pages/client/Promotions";
import Reviews from "./pages/client/Reviews";

// admin
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import Barbers from "./pages/admin/Barbers";
import Bookings from "./pages/admin/Bookings";
import History from "./pages/admin/History";
import PromotionsAdmin from "./pages/admin/Promotions";
import ReviewsAdmin from "./pages/admin/Reviews";
import BarberAvailability from "./pages/admin/BarberAvailability";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* CLIENT */}
        <Route element={<ClientLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/check-booking" element={<CheckBooking />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/reviews" element={<Reviews />} />
        </Route>

        {/* ADMIN */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="login" element={<Login />} />
          <Route element={<RequireAdmin />}>
            <Route index element={<Dashboard />} />
            <Route path="barbers" element={<Barbers />} />
            <Route path="barber-availability" element={<BarberAvailability />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="history" element={<History />} />
            <Route path="promotions" element={<PromotionsAdmin />} />
            <Route path="reviews" element={<ReviewsAdmin />} />

          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
