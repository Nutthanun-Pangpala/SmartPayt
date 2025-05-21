import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './index.css';
//Admin
import AddUser from "./pagesAdmin/Adduser";
import AdminDebtPage from "./pagesAdmin/AdminDebtPage";
import AdminLogin from "./pagesAdmin/AdminLogin";
import AdminMain from "./pagesAdmin/AdminMain";
import AdminRegister from "./pagesAdmin/AdminRegister";
import AdminService from "./pagesAdmin/AdminService";
import UserDetails from "./pagesAdmin/AdminUserDetails";
import AdminVerified from "./pagesAdmin/AdminVerified";


//User
import UserDashboard from "./pagesUser/UserDashboard";
import Login from "./pagesUser/UserLoginPage";
import RegisterAccount from "./pagesUser/UserRegisterAccounts";
import RegisterAddress from "./pagesUser/UserRegisterAddressPages";
import Issues from "./pagesUser/UserReportIssuesPages";


const router = createBrowserRouter([
//admin
  { path: "/admin/users/:lineUserId/add-address",element: <AddUser />,},
  { path: "/admin", element: <AdminMain /> },
  { path: "/adminregister", element: <AdminRegister /> },
  { path: "/adminlogin", element: <AdminLogin /> },
  { path: "/admin/service", element:<AdminService/> },
  { path: "/admin/debt", element:<AdminDebtPage/> },
  { path:"/admin/user/:lineUserId",element:<UserDetails />},
  { path: "/admin/users-verify",element:<AdminVerified/>},
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
