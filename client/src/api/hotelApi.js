
import axios from "axios";
import { auth } from "../firebase/firebaseConfig";

// API configuration
const API_URL = import.meta.env.DEV
  ? "http://localhost:5000/api"
  : "https://velsaka-stays.onrender.com/api";
  
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
  withCredentials: true,
});

// ==========================================
// FIREBASE AUTHENTICATION INTERCEPTOR
// ==========================================

api.interceptors.request.use(
  async (config) => {
    try {
      const currentUser = auth.currentUser;

      if (currentUser) {
        const token = await currentUser.getIdToken();

        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      console.error("Firebase token error:", error);
      return Promise.reject(error);
    }
  },
  (error) => Promise.reject(error)
);

// ==========================================
// RESPONSE NORMALIZER
// ==========================================

const normalizeHotels = (response) => {
  // Backend: { success: true, data: [...] }
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  // Backend: { success: true, hotels: [...] }
  if (Array.isArray(response?.hotels)) {
    return response.hotels;
  }

  // Direct array: [...]
  if (Array.isArray(response)) {
    return response;
  }

  // Nested response: { data: { hotels: [...] } }
  if (Array.isArray(response?.data?.hotels)) {
    return response.data.hotels;
  }

  console.error("Unexpected hotels API response:", response);

  throw new Error(
    "Invalid hotels data received from server. Expected an array."
  );
};

// ==========================================
// GET ALL HOTELS
// ==========================================

export const getHotels = async (params = {}) => {
  try {
    const response = await api.get("/hotels", { params });

    return normalizeHotels(response.data);
  } catch (error) {
    console.error("GET HOTELS API ERROR:", {
      message: error.message,
      status: error.response?.status,
      response: error.response?.data,
    });

    throw error;
  }
};

// ==========================================
// GET HOTEL BY ID
// ==========================================

export const getHotelById = async (id) => {
  try {
    if (!id) {
      throw new Error("Hotel ID is required.");
    }

    const response = await api.get(`/hotels/${id}`);

    return response.data;
  } catch (error) {
    console.error("GET HOTEL BY ID ERROR:", {
      message: error.message,
      status: error.response?.status,
      response: error.response?.data,
    });

    throw error;
  }
};

// ==========================================
// GET NEARBY HOTELS
// ==========================================

export const getNearbyHotels = async (params = {}) => {
  try {
    const response = await api.get("/hotels/nearby", { params });

    return normalizeHotels(response.data);
  } catch (error) {
    console.error("GET NEARBY HOTELS ERROR:", {
      message: error.message,
      status: error.response?.status,
      response: error.response?.data,
    });

    throw error;
  }
};

// ==========================================
// EXPORT AXIOS INSTANCE
// ==========================================

export default api;
