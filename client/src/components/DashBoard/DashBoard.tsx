"use client";

import { useUser } from "@clerk/clerk-react";
import { ApolloProvider, useMutation, useQuery } from "@apollo/client/react";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import EmptyProject from "./EmptyProject";
import ProjectTable from "./ProjectTable";

import { useApolloClient } from "@/lib/apollo";
import { CREATE_PROJECT } from "@/graphql/projects";

/**
 * 1. INNER COMPONENT
 * This component lives inside the ApolloProvider. 
 * It can use hooks like useQuery() without any extra config.
 */
function DashBoardContent() {
  const { user } = useUser();
  const { data, loading, error } = useQuery(CREATE_PROJECT);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="animate-pulse">Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Error loading projects: {error.message}
      </div>
    );
  }

  const projects = data?.projects ?? [];

  return (
    <div className="h-screen w-screen flex bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar user={user} />

        <main className="flex-1 p-6 overflow-auto">
          {projects.length === 0 ? (
            <EmptyProject />
          ) : (
            <ProjectTable projects={projects} />
          )}
        </main>
      </div>
    </div>
  );
}

/**
 * 2. MAIN EXPORT (The Shell)
 * This handles the "Setup" logic: Auth check and Apollo initialization.
 */
export default function DashBoard() {
  const { isSignedIn, user, isLoaded } = useUser();
  
  // No need to call useApolloClient() here! 
  // useQuery automatically finds the client from the root Provider.
  const { data, loading, error } = useMutation(CREATE_PROJECT, {
    skip: !isSignedIn,
  });

  if (!isLoaded || loading) return <div>Loading...</div>;
  if (!isSignedIn) return <div>Please log in.</div>;
  if (error) return <div>Error: {error.message}</div>;

  const projects = data?.projects ?? [];

  return (
    <div className="h-screen w-screen flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} />
        <main className="flex-1 p-6">
          {projects.length === 0 ? <EmptyProject /> : <ProjectTable projects={projects} />}
        </main>
      </div>
    </div>
  );
}
