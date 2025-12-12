import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Playground from "../page/Playground";
import DashBoard from "../page/DashBoard";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <DashBoard /> },
      { path: "playground", element: <Playground /> },
      { path: "dashboard", element: <DashBoard /> },
    ],
  },
]);
