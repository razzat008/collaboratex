import { ApolloClient, HttpLink, InMemoryCache, createHttpLink, from } from "@apollo/client";
import { SetContextLink } from "@apollo/client/link/context";

// This is a regular function, not a hook
export const createApolloClient = (getToken: () => Promise<string | null>) => {
  const httpLink =  new HttpLink({
    uri: "http://localhost:8080/query"
  });

  const authLink = new SetContextLink(async (_, { headers }) => {
    const token = await getToken();
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      },
    };
  });

  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  });
};
