import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import ComposePage from "./pages/ComposePage";
import Sidebar from "./components/layouts/Sidebar";
import Topbar from "./components/layouts/Topbar";
import useSocket from "./hooks/useSocket";

export default function App() {
  const { socketRef, connected } = useSocket();

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-950 text-white">
        <Sidebar />

        <div className="flex-1">
          <Topbar socketConnected={connected} />

          <div className="p-6">
            <Routes>
              <Route path="/" element={<Dashboard socketRef={socketRef} />} />
              <Route path="/compose" element={<ComposePage />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
