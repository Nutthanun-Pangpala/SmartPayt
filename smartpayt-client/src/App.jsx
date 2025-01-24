import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Line from './auth/line';
import './index.css';
import AdminDashboard from "./pages/admin/AdminPage";

import Login from './pages/login';
import Register from './pages/RegisterPage';

const router = createBrowserRouter([
  { path: "/", element: <Register /> },
  { path: "/admin", element: <AdminDashboard /> },
  { path: "/login", element: <Login /> },
  { path: "/line", element: <Line /> },
], {
  future: {
    v7_startTransition: true, // เปิดฟีเจอร์ Transition ล่วงหน้า
  },
});

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
