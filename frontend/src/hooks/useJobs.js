import { useEffect, useState, useCallback } from "react";
import { fetchJobs } from "../services/jobsApi";

export default function useJobs(socket) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadJobs = useCallback(async () => {
    try {
      setError(null);
      const res = await fetchJobs();
      setJobs(res.data || []);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      setError("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    const s = socket && typeof socket === "object" && "current" in socket ? socket.current : socket;
    if (!s || typeof s.on !== "function") return;

    s.on("job:queued", loadJobs);
    s.on("job:started", loadJobs);
    s.on("job:completed", loadJobs);
    s.on("job:failed", loadJobs);

    return () => {
      s.off("job:queued", loadJobs);
      s.off("job:started", loadJobs);
      s.off("job:completed", loadJobs);
      s.off("job:failed", loadJobs);
    };
  }, [socket, loadJobs]);


  return { jobs, loading, error, reload: loadJobs };
}
