import axios from "axios";

const API_URL = "http://localhost:8086/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  if (token) {
    config.headers["X-User-ID"] = userId;
  }
  return config;
});

export const getActivities = () => api.get("/activities");
export const addActivity = (activity) => api.post("/activities", activity);
export const getActivityDetail = (id) => api.get(`/recommendations/activity/${id}`);

// UserController is mapped at "/api/v1" on the user-service; baseURL already
// includes "/api", so the relative path here only needs "/v1/...".
export const getUserProfile = () => api.get("/v1/profile");
export const validateUser = (userId) => api.get(`/v1/${userId}/validate`);