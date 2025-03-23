import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './index.css';
import AddUser from "./pages/admin/Adduser";
import AdminDashboard from "./pages/admin/AdminPage";
import Issues from "./pages/issues";
import Login from "./pages/login";
import Register from "./pages/RegisterPage";
import DashboardMain from "./pages/user/userDashboard";

const router = createBrowserRouter([



  //admin
  { path: "/admin",element: <AdminDashboard />,},
  { path: "/AddUser",element: <AddUser />,},




  //user
  { path: "/login", element: <Login /> },
  { path: "/", element: <Register />,},
  { path: "/dashboard" ,element: <DashboardMain/>},
  { path: "/issues", element: <Issues/>},
], {
  future: {
    v7_startTransition: true,
  },
});

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
