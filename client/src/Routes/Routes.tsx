import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Playground from "../page/Playground";
import DashBoard from "../page/DashBoard";
import LandingLayout from "../layouts/LandingLayout";
import ProtectedRoute from "../components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <LandingLayout /> }, // public landing page
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <DashBoard />
          </ProtectedRoute>
        ),
      },
      {
        path: "playground",
        element: (
            <Playground />
        ),
      },
    ],
  },
]);
