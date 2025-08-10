import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../user/img/LogoNav.png";

const NavbarComponent = () => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="border-gray-200 bg-green-700 flex justify-between items-center px-4 md:px-6">
      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <a
          href="http://localhost:5173/UserDashboard"
          className="flex items-center space-x-2 rtl:space-x-reverse"
        >
          <img
            className="h-16 w-auto md:h-28 md:w-auto"
            src={logo}
            alt="SmartPayt Logo"
          />
          <span className="self-center text-xl md:text-2xl font-semibold whitespace-nowrap text-white">
            SmartPayt
          </span>
        </a>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="relative w-10 h-10 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600 focus:outline-none"
          aria-haspopup="true"
          aria-expanded={open}
        >
          <div className="relative w-10 h-10 overflow-hidden bg-gray-100 rounded-full dark:bg-white">
            <svg
              className="absolute w-12 h-12 text-gray-400 -left-1"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
            <ul className="py-1 text-gray-700">
              <li>
                <button
                    className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                    onClick={() => {
                      const lineUserId = localStorage.getItem("lineUserId");
                      navigate(`/accountmanagement/${lineUserId}`);
                      setOpen(false);
                    }}
                  >
                    จัดการบัญชี
                  </button>
              </li>
              <li>
                <button
                  className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                  onClick={() => {
                    localStorage.removeItem("lineUserId");
                    localStorage.removeItem("token");
                    alert("ออกจากระบบแล้ว");
                    window.location.href = "/";
                  }}
                >
                  ออกจากระบบ
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavbarComponent;
