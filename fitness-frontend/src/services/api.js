import axios from "axios";

const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';

const API_BASE = (hostname === 'localhost' || hostname === '127.0.0.1')
  ? "http://localhost:8086/api"
  : `${protocol}//${hostname}:8086/api`;

const api = axios.create({
  baseURL: API_BASE,
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