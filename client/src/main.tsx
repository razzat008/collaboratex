import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { SidebarProvider } from "./components/ui/sidebar";
import { RouterProvider } from "react-router-dom";
import { router } from "./Routes/Routes";

import { ClerkProvider } from "@clerk/clerk-react";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY!;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      {/* <SidebarProvider> */}
        <RouterProvider router={router} />
      {/* </SidebarProvider> */}
    </ClerkProvider>
  </StrictMode>,
);
