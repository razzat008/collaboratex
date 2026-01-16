import React from 'react';

import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

const ProtectedRoutes: React.FC = () => {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) { return null; }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoutes;
