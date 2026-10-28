
import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

// Axios instance for POST, PUT, PATCH, DELETE and other API requests
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Shared GET request helper for hotel endpoints
async function apiRequest(endpoint, params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();
  const url = `${API_BASE_URL}${endpoint}${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await fetch(url, {
    credentials: "include",
  });

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(
      result.message || `Request failed with status ${response.status}`
    );
  }

  return result;
}

// GET /api/hotels
export async function getHotels(params = {}) {
  const result = await apiRequest("/hotels", params);

  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.hotels)) return result.hotels;
  if (Array.isArray(result.data?.hotels)) return result.data.hotels;

  return [];
}

// GET /api/hotels/nearby
export async function getNearbyHotels(params = {}) {
  const result = await apiRequest("/hotels/nearby", params);

  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.hotels)) return result.hotels;

  return [];
}

// GET /api/hotels/:id
export async function getHotelById(id) {
  if (!id) {
    throw new Error("Hotel ID is required.");
  }

  const result = await apiRequest(
    `/hotels/${encodeURIComponent(id)}`
  );

  return result.data?.hotel ?? result.data ?? result.hotel ?? result;
}

// Default Axios export used by BookingConfirm.jsx
export default api;
