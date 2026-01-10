import React from "react";
import { UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

export default function Topbar({ user }) {
  return (
    <header className="h-14 border-b border-gray-300 px-4 flex items-center justify-between bg-gray-200">
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="font-medium text-gray-700 hover:text-gray-900">Dashboard</Link>
        <Link to="/playground" className="font-medium text-gray-700 hover:text-gray-900">Playground</Link>
      </div>

      <div className="flex items-center gap-2">
        <UserButton />
      </div>
    </header>
  );
}
