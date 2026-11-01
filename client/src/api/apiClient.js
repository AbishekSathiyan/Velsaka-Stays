
import axios from "axios";
import { auth } from "../firebase/firebaseConfig";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Firebase ID token to every request.
apiClient.interceptors.request.use(
  async (config) => {
    const currentUser = auth.currentUser;

    if (currentUser) {
      const token = await currentUser.getIdToken();

      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle common API errors.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      "API ERROR:",
      error.response?.data || error.message
    );

    return Promise.reject(error);
  }
);

export default apiClient;
