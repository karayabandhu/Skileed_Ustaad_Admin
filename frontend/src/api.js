import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://200.234.47.38:5000/api";

const api = axios.create({
  baseURL: API_BASE,
});

// Interceptor to add Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.headers.Authorization ? "Token Present" : "Token Missing");
    return config;
  },
  (error) => Promise.reject(error)
);

// Function to refresh the admin token
const tryRefreshToken = async () => {
   try {
      // Use raw axios to avoid interceptor loop
      const response = await axios.post(`${API_BASE}/auth/refresh-token`, {}, { withCredentials: true });
      if (response.data.accessToken) {
         localStorage.setItem("token", response.data.accessToken);
         return response.data.accessToken;
      }
   } catch (err) {
      console.error("Admin session renewal failed:", err.response?.data || err.message);
   }
   return null;
};
 
// Response interceptor to handle 401 errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 500) {
      console.error("[API Error 500]", error.response.data);
    }
 
    // If 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await tryRefreshToken();
      
      if (newToken) {
         originalRequest.headers.Authorization = `Bearer ${newToken}`;
         return api(originalRequest); // Retry original request with new token
      }
 
      console.warn("[API Error] 401 Unauthorized - Session expired");
      localStorage.removeItem("token");
      localStorage.removeItem("admin");
      
      // Only redirect if not already on login
      if (window.location.pathname !== "/login") {
         window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
