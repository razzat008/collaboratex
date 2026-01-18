import { StrictMode, useMemo } from "react";
import ReactDOM from 'react-dom/client';
import App from './App';
import { ApolloProvider } from "@apollo/client/react";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { createApolloClient } from './src/lib/Apollo';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY!;

const ApolloProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  const { getToken } = useAuth();
  const client = useMemo(() => createApolloClient(getToken), [getToken]);
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};

const root = ReactDOM.createRoot(rootElement);
root.render(
    <ClerkProvider publishableKey={clerkPubKey}>
      <ApolloProviderWrapper>
        {/* <SidebarProvider> */}
        <App />
        {/* </SidebarProvider> */}
      </ApolloProviderWrapper>
    </ClerkProvider>
);
