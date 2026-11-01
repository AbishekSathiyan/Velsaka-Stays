
import { Routes, Route } from "react-router-dom";

// User pages
import Home from "../pages/Home.jsx";
import AuthPage from "../pages/AuthPage.jsx";
import HotelDetails from "../pages/HotelDetails.jsx";
import Favorites from "../pages/Favorites.jsx";
import BookingConfirm from "../pages/BookingConfirm.jsx";
import ProfilePage from "../pages/ProfilePage.jsx";
import NotFound from "../pages/NotFound.jsx";

// Admin components
import AdminRoute from "../components/AdminRoute.jsx";
import AdminLayout from "../admin/AdminLayout.jsx";

// Admin pages
import AdminDashboard from "../admin/AdminDashboard.jsx";
import AdminHotels from "../admin/AdminHotels.jsx";
import AdminBookings from "../admin/AdminBookings.jsx";
import AdminCustomers from "../admin/AdmiUsers.jsx";
import AdminAnalytics from "../admin/AdminAnalytics.jsx";

export default function AppRouter() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/hotels/:id" element={<HotelDetails />} />
      <Route path="/favorites" element={<Favorites />} />
      <Route path="/booking/confirm" element={<BookingConfirm />} />
      <Route path="/profile" element={<ProfilePage />} />

      {/* Protected Admin Routes */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="hotels" element={<AdminHotels />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Route>
      </Route>

      {/* 404 Route - Always Last */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
