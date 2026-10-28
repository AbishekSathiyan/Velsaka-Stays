
import api from "./authApi";

export const getMyBookings = async () => {
  const response = await api.get("/bookings/my");
  return response.data;
};
