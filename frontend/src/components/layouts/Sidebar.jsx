import { NavLink } from "react-router-dom";
import { FiMail, FiHome, FiPlus } from "react-icons/fi";

export default function Sidebar() {
  const menu = [
    { label: "Dashboard", icon: <FiHome />, path: "/" },
    { label: "Compose Email", icon: <FiPlus />, path: "/compose" },
  ];

  return (
    <div className="w-64 h-screen bg-gray-900 border-r border-gray-800 flex flex-col p-4">
      
      <h1 className="text-2xl font-bold text-white mb-8">
        MailQueue
      </h1>

      <nav className="space-y-2">
        {menu.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition
               ${isActive
                 ? "bg-gray-800 text-white"
                 : "text-gray-400 hover:bg-gray-800 hover:text-white"}`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
