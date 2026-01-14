"use client";

import { useUser } from "@clerk/clerk-react";
// import { ApolloProvider, useMutation, useQuery } from "@apollo/client/react";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import EmptyProject from "./EmptyProject";
import ProjectTable from "./ProjectTable";
import LoadingScreen from "./Loading";

import { useGetProjects } from "@/graphql/generated";



export default function DashBoard() {
  const { user, isLoaded } = useUser();

  const { data, loading, error } = useGetProjects();

  if (!isLoaded || loading) return <LoadingScreen />;
  if (error) return <div>Error: {error.message}</div>;

  const projects =
    data?.projects?.map((p) => ({
      id: p.id,
      projectName: p.projectName,
      createdAt: p.createdAt,
      lastEditedAt: p.lastEditedAt,
      ownerId: p.ownerId,
      collaboratorIds: p.collaboratorIds,
      rootFileId: p.rootFileId,
    })) ?? [];

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
