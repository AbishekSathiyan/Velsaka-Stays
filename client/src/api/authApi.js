import api from "./axios";
import { auth } from "../firebase/firebaseConfig";

// Get current Firebase user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Sync Firebase user with MongoDB
export const syncUser = async (userData = {}) => {
  const response = await api.post("/auth/sync", userData);
  return response.data;
};

// Get MongoDB profile
export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

// Update profile
export const updateProfile = async (profileData) => {
  const response = await api.put("/auth/profile", profileData);
  return response.data;
};

// Logout
export const logoutUser = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};