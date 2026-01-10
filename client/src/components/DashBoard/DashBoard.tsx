import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import EmptyProject from "./EmptyProject";
import ProjectTable from "./ProjectTable";

export default function DashBoard() {
  const { isSignedIn, user } = useUser();
  const [projects, setProjects] = useState([]);

  // Fetch projects for logged-in user
  useEffect(() => {
    if (!isSignedIn) return;

    const fetchProjects = async () => {
      try {
        const clerkToken = await user?.getToken(); // Clerk JWT
        const res = await axios.get("http://localhost:8080/api/projects", {
          headers: { Authorization: `Bearer ${clerkToken}` },
        });

        setProjects(res.data); // [{_id, projectName, lastModified, userName}, ...]
      } catch (err) {
        console.error("Error fetching projects:", err);
      }
    };

    fetchProjects();
  }, [isSignedIn, user]);

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-700">Please log in to access the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex">
      <Sidebar setProjects={setProjects} />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} />
        <main className="flex-1 p-6 overflow-auto bg-gray-50">
          {projects.length === 0 ? (
            <EmptyProject />
          ) : (
            <ProjectTable projects={projects} setProjects={setProjects} />
          )}
        </main>
      </div>
    </div>
  );
}

