import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './index.css';
//Admin
import AddUser from "./pagesAdmin/Adduser";
import AdminDebtPage from "./pagesAdmin/AdminDebtPage";
import AdminLogin from "./pagesAdmin/AdminLogin";
import AdminMain from "./pagesAdmin/AdminMain";
import AdminManualBill from "./pagesAdmin/AdminManulBill";
import AdminPaymentSlipPage from "./pagesAdmin/AdminPaymentSlipPage";
import AdminRegister from "./pagesAdmin/AdminRegister";
import AdminService from "./pagesAdmin/AdminService";
import UserDetails from "./pagesAdmin/AdminUserDetails";
import Report from "./pagesAdmin/Report";
import ScanAndCreateBill from "./pagesAdmin/ScanAndCreateBill";
import VerifiedAddress from "./pagesAdmin/VerifiedAddress";
import VerifiedUser from "./pagesAdmin/VerifiedUser";
import WastePriceEstablishment from "./pagesAdmin/WastePriceEstablishment";
import WastePricehousehold from "./pagesAdmin/WastePricehousehold";

//User
import AdminAuditLog from "./pagesAdmin/AdminAuditLog";
import AccountManagement from "./pagesUser/UserAccountManagement";
import WasteChartsMulti from "./pagesUser/UserChart";
import UserDashboard from "./pagesUser/UserDashboard";
import Login from "./pagesUser/UserLoginPage";
import PaymentHistory from "./pagesUser/UserPaymentHistory";
import PaymentPage from "./pagesUser/UserPaymentPage";
import QRPaymentPage from "./pagesUser/UserQrPaymentPage";
import RegisterAccount from "./pagesUser/UserRegisterAccounts";
import RegisterAddress from "./pagesUser/UserRegisterAddressPages";
import Issues from "./pagesUser/UserReportIssuesPages";


const router = createBrowserRouter([
//admin
  { path: "api/admin/users/:lineUserId/add-address",element: <AddUser />,},
  { path: "/admin", element: <AdminMain /> },
  { path: "/adminregister", element: <AdminRegister /> },
  { path: "/adminlogin", element: <AdminLogin /> },
  { path: "/admin/service", element:<AdminService/> },
  { path: "/admin/debt", element:<AdminDebtPage/> },
  { path:"/admin/user/:lineUserId",element:<UserDetails />},
  { path:"/admin/bills",element:<AdminManualBill />},
  { path:"/admin/household",element:<WastePricehousehold />},
  { path:"/admin/establishment",element:<WastePriceEstablishment />},
  { path:"/admin/verified-address",element:<VerifiedAddress />},
  { path:"/admin/verified-user",element:<VerifiedUser />},
  { path:"/admin/payment-slips",element:<AdminPaymentSlipPage />},
  { path:"/admin/report",element:<Report />},
  { path:"/admin/scan",element:<ScanAndCreateBill />},
  { path:"/admin/audit-log",element:<AdminAuditLog/>},


  
//user
  { path: "/userLogin", element: <Login /> },
  { path: "/registerAddress", element: <RegisterAddress />,},
  { path: "/registerAccount", element: <RegisterAccount/>,},
  { path: "/" ,element: <UserDashboard/>},
  { path: "/issues", element: <Issues/>},
  { path: "/payment", element: <PaymentPage/> },
  { path: "/payment/qr", element: <QRPaymentPage/> },
  { path: "/accountmanagement/:lineUserId", element: <AccountManagement/> },
  { path: "/paymenthistory/:lineUserId", element: <PaymentHistory/> },
  { path: "/wastedata/:lineUserId", element: <WasteChartsMulti/> }

  
  

], {
  future: {
    v7_startTransition: true,
  },
});

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
