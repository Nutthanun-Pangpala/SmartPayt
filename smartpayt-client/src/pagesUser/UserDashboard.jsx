import React from "react";
import UserAddressesCard from "../assets/component/user/UserDashboard/userAddressCard";
import UserDatacard from "../assets/component/user/UserDashboard/userDataCard";
import NavbarComponent from "../assets/component/user/userNavbar";
import BottomNav from "../assets/component/user/userNavigate";

const UserDashboard = () => {
  return (
    <div className=" bg-gray-200 min-h-screen">
      <NavbarComponent />
      <UserDatacard />
      <UserAddressesCard />
        <BottomNav />
    </div>
  );
};

export default UserDashboard;
