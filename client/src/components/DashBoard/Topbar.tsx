import { UserButton, type UserResource } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { NavLink } from "react-router-dom";

export default function Topbar({ user }: { user: UserResource | null }) {
  return (
    <header className="h-14 border-b border-gray-300 px-4 flex items-center bg-gray-200">
      <div className="flex items-center gap-4 ml-auto">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-md transition ${isActive
              ? "bg-gray-300 text-gray-900"
              : "text-gray-700 hover:bg-gray-300"
            }`
          }
        >
          Dashboard
        </NavLink>
        <NavLink to="/playground"
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-md transition ${isActive
              ? "bg-gray-300 text-gray-900"
              : "text-gray-700 hover:bg-gray-300"
            }`
          }
        >
          Playground
        </NavLink>
        <UserButton />
      </div>
    </header>
  );
}
