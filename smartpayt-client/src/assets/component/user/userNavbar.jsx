import React from "react";
import logo from "../user/img/LogoNav.png";

const NavbarComponent = () => {
  return (
    <nav className="border-gray-200 bg-green-700">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between p-4 md:p-6">
        <a href="http://localhost:5173/UserDashboard" className="flex items-center space-x-2 rtl:space-x-reverse">
          <img className=" h-16 w-auto md:w-auto md:h-28" src={logo} alt="Logo" />
          <span className="self-center text-xl md:text-2xl font-semibold whitespace-nowrap dark:text-white">SmartPayt</span>
        </a>
      </div>
    </nav>
  );
};

export default NavbarComponent;
