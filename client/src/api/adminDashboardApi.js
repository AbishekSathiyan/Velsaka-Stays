
import apiClient from "./apiClient";

// GET /api/admin/dashboard
export const getAdminDashboard = async () => {
  const response = await apiClient.get("/admin/dashboard");

  const data = response.data;

  if (!data?.success) {
    throw new Error(
      data?.message || "Failed to load admin dashboard."
    );
  }

  return {
    stats: data.stats || {},
    chartData: Array.isArray(data.chartData)
      ? data.chartData
      : [],
    recentBookings: Array.isArray(data.recentBookings)
      ? data.recentBookings
      : [],
  };
};

// GET /api/admin/bookings
export const getAdminBookings = async () => {
  const response = await apiClient.get("/admin/bookings");
  return response.data;
};

// GET /api/admin/customers
export const getAdminCustomers = async () => {
  const response = await apiClient.get("/admin/customers");
  return response.data;
};

// GET /api/admin/hotels
export const getAdminHotels = async () => {
  const response = await apiClient.get("/admin/hotels");
  return response.data;
};
