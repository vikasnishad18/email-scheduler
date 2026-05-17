export default function Topbar({ socketConnected }) {
  return (
    <div className="h-16 flex items-center justify-between bg-gray-900 border-b border-gray-800 px-6">
      <h2 className="text-xl text-white font-semibold">Dashboard</h2>

      <div className="flex items-center gap-4">
        <span
          className={`px-3 py-1 text-sm rounded-full ${
            socketConnected ? "bg-green-700 text-green-100" : "bg-red-700 text-red-200"
          }`}
        >
          {socketConnected ? "Live" : "Offline"}
        </span>
      </div>
    </div>
  );
}
