import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './index.css';
import AddUser from "./pages/admin/Adduser";
import UserDashboard from "./pages/UserDashboard";
import Login from "./pages/UserLoginPage";
import RegisterAccount from "./pages/UserRegisterAccounts";
import RegisterAddress from "./pages/UserRegisterAddressPages";
import Issues from "./pages/UserReportIssuesPages";

const router = createBrowserRouter([
//admin
  { path: "/AddUser",element: <AddUser />,},
//user
  { path: "/userLogin", element: <Login /> },
  { path: "/", element: <RegisterAddress />,},
  { path: "/registerAccount", element: <RegisterAccount/>,},
  { path: "/userDashboard" ,element: <UserDashboard/>},
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
