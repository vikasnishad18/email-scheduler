import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

export function sendEmail(data) {
  return axios.post(`${API_BASE}/api/send-email`, data);
}

export function scheduleEmail(data) {
  return axios.post(`${API_BASE}/api/schedule-email`, data);
}
