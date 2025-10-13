import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { LandingPage } from "./pages/LandingPage";
import { PoolsPage } from "./pages/PoolsPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/dashboard",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <PoolsPage />,
      },
      // Future routes can be added here:
      // {
      //   path: "pools/:poolId",
      //   element: <PoolDetailPage />,
      // },
      // {
      //   path: "analytics",
      //   element: <AnalyticsPage />,
      // },
    ],
  },
  {
    path: "/pools",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <PoolsPage />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
