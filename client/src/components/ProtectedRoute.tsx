// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({ children, redirectTo = "/" }: ProtectedRouteProps) {
  const { isSignedIn, isLoaded } = useUser();

  // Wait until Clerk finishes loading the user
  if (!isLoaded) return null; // or a loading spinner

  if (!isSignedIn) {
    // Not signed in → redirect
    return <Navigate to={redirectTo} replace />;
  }

  // Signed in → render children
  return <>{children}</>;
}

