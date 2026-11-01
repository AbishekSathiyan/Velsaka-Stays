import api from "./axios";

// Create booking
export const createBooking = async (bookingData) => {
  const response = await api.post("/bookings", bookingData);
  return response.data;
};

// Get logged-in user's bookings
export const getMyBookings = async () => {
  const response = await api.get("/bookings/my");
  return response.data;
};

// Get booking by ID
export const getBookingById = async (bookingId) => {
  const response = await api.get(`/bookings/${bookingId}`);
  return response.data;
};

// Cancel booking
export const cancelBooking = async (bookingId) => {
  const response = await api.put(`/bookings/${bookingId}/cancel`);
  return response.data;
};

// Export default API object (for existing default imports)
const bookingApi = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
};

export default bookingApi;