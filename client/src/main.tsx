"use client";
import { StrictMode, useMemo } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { SidebarProvider } from "./components/ui/sidebar";
import { RouterProvider } from "react-router-dom";
import { router } from "./Routes/Routes";

import { ApolloProvider } from "@apollo/client/react";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { createApolloClient } from "./lib/apollo";

const ApolloProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  const { getToken } = useAuth();

  // Now we use the function 'createApolloClient' inside useMemo correctly
  const client = useMemo(() => createApolloClient(getToken), [getToken]);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY!;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <ApolloProviderWrapper>
        {/* <SidebarProvider> */}
          <RouterProvider router={router} />
        {/* </SidebarProvider> */}
      </ApolloProviderWrapper>
    </ClerkProvider>
  </StrictMode>
);
