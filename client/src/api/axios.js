import axios from "axios";
import { auth } from "../firebase/firebaseConfig";
const api = axios.create({
  baseURL: import.meta.env.DEV
  ? "http://localhost:5000/api"
  : "https://velsaka-stays.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
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

export default api;