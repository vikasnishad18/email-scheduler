export default function JobsTable({ jobs, onSelect, error }) {
  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  if (!jobs || jobs.length === 0) {
    return <p className="text-gray-400">No jobs yet.</p>;
  }

  const statusColors = {
    queued: "bg-yellow-600",
    active: "bg-blue-600",
    completed: "bg-green-600",
    failed: "bg-red-600",
  };

  return (
    <table className="w-full bg-gray-900 rounded-lg overflow-hidden">
      <thead className="bg-gray-800 text-gray-300">
        <tr>
          <th className="p-3 text-left">ID</th>
          <th className="p-3 text-left">Email</th>
          <th className="p-3 text-left">Subject</th>
          <th className="p-3 text-left">Status</th>
          <th className="p-3 text-left">Queued At</th>
          <th className="p-3 text-left">Actions</th>
        </tr>
      </thead>

      <tbody>
        {jobs.map(job => (
          <tr key={job.id} className="border-b border-gray-800">
            <td className="p-3">{job.id}</td>
            <td className="p-3">{job.to_email}</td>
            <td className="p-3">{job.subject}</td>

            <td className="p-3">
              <span
                className={`px-3 py-1 rounded text-sm ${
                  statusColors[job.status] || "bg-gray-700"
                }`}
              >
                {job.status}
              </span>
            </td>

            <td className="p-3">
              {job.queued_at
                ? new Date(job.queued_at).toLocaleString()
                : "-"}
            </td>

            <td className="p-3">
              <button
                onClick={() => onSelect(job)}
                className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700"
              >
                View
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
