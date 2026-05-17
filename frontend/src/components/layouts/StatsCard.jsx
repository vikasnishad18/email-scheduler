export default function StatsCards({ stats }) {
  const cards = [
    { label: "Queued", value: stats.queued || 0, color: "bg-yellow-500" },
    { label: "Active", value: stats.active || 0, color: "bg-blue-500" },
    { label: "Completed", value: stats.completed || 0, color: "bg-green-500" },
    { label: "Failed", value: stats.failed || 0, color: "bg-red-500" },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 my-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className="p-4 rounded-xl bg-gray-900 border border-gray-800 shadow-lg transform hover:scale-[1.02] transition"
        >
          <p className="text-gray-400 text-sm">{c.label}</p>
          <h3 className={`text-3xl font-bold ${c.color} text-white mt-1`}>
            {c.value}
          </h3>
        </div>
      ))}
    </div>
  );
}
