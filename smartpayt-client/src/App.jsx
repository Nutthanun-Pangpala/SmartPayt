import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './index.css';
import AdminDashboard from "./pages/admin/AdminPage";
import Login from "./pages/login";
import Register from "./pages/RegisterPage";
import DashboardMain from "./pages/user/userDashboard";

const router = createBrowserRouter([



  //admin
  {
    path: "/admin",
    element: <AdminDashboard />,
  },




  //user
  { path: "/login", element: <Login /> },
  { path: "/", element: <Register />,},
  { path: "/dashboard" ,element: <DashboardMain/>},
], {
  future: {
    v7_startTransition: true,
  },
});

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
