import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import HotelDetails from "./pages/HotelDetails.jsx";
import BookingConfirm from "./pages/BookingConfirm.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/hotels/:id" element={<HotelDetails />} />
        <Route path="/booking/confirm" element={<BookingConfirm />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="*"
          element={<main className="p-10">Page not found.</main>}
        />
      </Routes>
    </BrowserRouter>
  );
}
