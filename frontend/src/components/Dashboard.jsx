import { useState } from "react";
import useJobs from "../hooks/useJobs";
import JobsTable from "./JobsTable";
import JobDetails from "./JobDetails";

export default function Dashboard({ socketRef }) {
  const { jobs, loading } = useJobs(socketRef);
  const [selectedJob, setSelectedJob] = useState(null);

  return (
    <div className="p-6 text-white min-h-screen bg-gray-950">
      <h1 className="text-3xl font-bold mb-6">Email Queue Dashboard</h1>

      {loading ? (
        <p className="text-gray-400">Loading jobs...</p>
      ) : (
        <JobsTable jobs={jobs} onSelect={setSelectedJob} />
      )}

      {selectedJob && (
        <JobDetails job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </div>
  );
}
