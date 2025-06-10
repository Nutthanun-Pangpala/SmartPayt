import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './index.css';
//Admin
import AddUser from "./pagesAdmin/Adduser";
import AdminDebtPage from "./pagesAdmin/AdminDebtPage";
import AdminLogin from "./pagesAdmin/AdminLogin";
import AdminMain from "./pagesAdmin/AdminMain";
import AdminManualBill from "./pagesAdmin/AdminManulBill";
import AdminRegister from "./pagesAdmin/AdminRegister";
import AdminService from "./pagesAdmin/AdminService";
import UserDetails from "./pagesAdmin/AdminUserDetails";
import AdminWastePricing from "./pagesAdmin/AdminWastePricing";
import VerifiedAddress from "./pagesAdmin/VerifiedAddress";
import VerifiedUser from "./pagesAdmin/VerifiedUser";
import AdminPaymentSlipPage from "./pagesAdmin/AdminPaymentSlipPage";
import Report from "./pagesAdmin/Report";

//User
import UserDashboard from "./pagesUser/UserDashboard";
import Login from "./pagesUser/UserLoginPage";
import PaymentPage from "./pagesUser/UserPaymentPage";
import RegisterAccount from "./pagesUser/UserRegisterAccounts";
import RegisterAddress from "./pagesUser/UserRegisterAddressPages";
import Issues from "./pagesUser/UserReportIssuesPages";
import QRPaymentPage from "./pagesUser/UserQrPaymentPage";


const router = createBrowserRouter([
//admin
  { path: "/admin/users/:lineUserId/add-address",element: <AddUser />,},
  { path: "/admin", element: <AdminMain /> },
  { path: "/adminregister", element: <AdminRegister /> },
  { path: "/adminlogin", element: <AdminLogin /> },
  { path: "/admin/service", element:<AdminService/> },
  { path: "/admin/debt", element:<AdminDebtPage/> },
  { path:"/admin/user/:lineUserId",element:<UserDetails />},
  { path:"/admin/bills",element:<AdminManualBill />},
  { path:"/admin/editwaste",element:<AdminWastePricing />},
  { path:"/admin/verified-address",element:<VerifiedAddress />},
  { path:"/admin/verified-user",element:<VerifiedUser />},
  { path:"/admin/payment-slips",element:<AdminPaymentSlipPage />},
  { path:"/admin/report",element:<Report />},


  
//user
  { path: "/userLogin", element: <Login /> },
  { path: "/", element: <RegisterAddress />,},
  { path: "/registerAccount", element: <RegisterAccount/>,},
  { path: "/userDashboard" ,element: <UserDashboard/>},
  { path: "/issues", element: <Issues/>},
  { path: "/payment", element: <PaymentPage/> },
  { path: "/payment/qr", element: <QRPaymentPage/> },

], {
  future: {
    v7_startTransition: true,
  },
});

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
