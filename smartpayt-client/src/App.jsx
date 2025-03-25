import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './index.css';
//Admin
import AddUser from "./pagesAdmin/Adduser";

//User
import UserDashboard from "./pagesUser/UserDashboard";
import Login from "./pagesUser/UserLoginPage";
import RegisterAccount from "./pagesUser/UserRegisterAccounts";
import RegisterAddress from "./pagesUser/UserRegisterAddressPages";
import Issues from "./pagesUser/UserReportIssuesPages";

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
