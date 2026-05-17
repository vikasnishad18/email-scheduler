import axios from "axios";
import { useCallback, useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function JobDetails({ job, onClose }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    if (!job?.id) return;
    try {
      const res = await axios.get(`${API_BASE}/api/jobs/${job.id}`);
      setEvents(res.data.events || []);
    } catch (err) {
      console.error("Failed to load job events:", err);
    } finally {
      setLoading(false);
    }
  }, [job?.id]);

  async function retryJob() {
    try {
      await axios.post(`${API_BASE}/api/jobs/${job.id}/retry`);
      alert("Retry triggered successfully");
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || "Retry failed");
    }
  }

  async function deleteJob() {
    try {
      await axios.delete(`${API_BASE}/api/jobs/${job.id}`);
      alert("Job deleted");
      onClose();
    } catch {
      alert("Delete failed");
    }
  }


  useEffect(() => {
    if (!job?.id) return;
    setLoading(true);
    loadEvents();
  }, [job?.id, loadEvents]);

  const statusColors = {
    queued: "text-yellow-400",
    active: "text-blue-400",
    completed: "text-green-400",
    failed: "text-red-400",
  };

  if (!job) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center backdrop-blur-sm z-50">
      <div className="bg-gray-900 text-white p-6 rounded-xl w-[500px] shadow-2xl animate-fadeIn">

        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-bold">Job Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-xl">✕</button>
        </div>

        {/* Job Info */}
        <div className="space-y-2 text-sm">
          <p><strong>ID:</strong> {job.id}</p>
          <p>
            <strong>Status:</strong>{" "}
            <span className={statusColors[job.status]}>{job.status}</span>
          </p>
          <p><strong>Email:</strong> {job.to_email}</p>
          <p><strong>Subject:</strong> {job.subject}</p>
          <p><strong>Body:</strong> {job.body}</p>
          <p><strong>Queued At:</strong> {new Date(job.queued_at).toLocaleString()}</p>

          {job.started_at && (
            <p><strong>Started:</strong> {new Date(job.started_at).toLocaleString()}</p>
          )}

          {job.completed_at && (
            <p><strong>Completed:</strong> {new Date(job.completed_at).toLocaleString()}</p>
          )}

          {job.failed_reason && (
            <p className="text-red-400"><strong>Failed:</strong> {job.failed_reason}</p>
          )}
        </div>

        {/* Timeline */}
        <h3 className="text-lg font-semibold mt-5 mb-2">Timeline</h3>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : events.length === 0 ? (
          <p className="text-gray-500 text-sm">No events recorded.</p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {events.map((e, i) => (
              <div
                key={i}
                className="border border-gray-700 rounded p-2 bg-gray-800 text-sm"
              >
                <p className="font-semibold capitalize">{e.event_type}</p>
                <p className="text-gray-400 text-xs">{new Date(e.created_at).toLocaleString()}</p>

                {e.data && (
                  <pre className="bg-gray-900 p-2 rounded text-xs mt-1 overflow-auto">
                    {JSON.stringify(e.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}

        {job.status !== "failed" && (
          <p className="text-yellow-500 text-sm mb-2">
            ⚠️ Only failed jobs can be retried. This one is {job.status}.
          </p>
        )}

        {/* Buttons */}
        <div className="flex justify-between mt-5">
          <button
            disabled={job.status !== "failed"}
            onClick={retryJob}
            className={`px-4 py-2 rounded ${
              job.status !== "failed"
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-yellow-600 hover:bg-yellow-700"
            }`}
          >
            Retry
          </button>

          <button
            onClick={deleteJob}
            className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
          >
            Delete
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-800"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
