import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

export function fetchJobs() {
  return axios.get(`${API_BASE}/api/jobs`);
}
