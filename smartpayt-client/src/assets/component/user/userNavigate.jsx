import React from "react";
import { useNavigate } from "react-router-dom";

const BottomNav = () => {
  const navigate = useNavigate();
  const lineUserId = localStorage.getItem("lineUserId");

  const items = [
    {
      label: "หน้าหลัก",
      icon: (
        <i className="fi fi-sr-home text-gray-500  group-hover:text-white dark:group-hover:text-white"></i>
      ),
      onClick: () => navigate("/UserDashboard"),
    },
    {
      label: "ประวัติการชำระ",
      icon: (
        <i className="fi fi-ss-clock  text-gray-500  group-hover:text-white dark:group-hover:text-white"></i>
      ),
      onClick: () => {
        if (lineUserId) {
          navigate(`/paymenthistory/${lineUserId}`);
        } else {
          alert("ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินก่อน");
          // หรือ navigate ไปหน้า login
          navigate("/");
        }
      },
    },
    {
      label: "Favorites",
      icon: (
        <svg
          className="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-white dark:group-hover:text-white"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 22 20"
        >
          <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200">
      <div className="grid h-full max-w-lg grid-cols-3 mx-auto">
        {items.map((item, index) => (
          <button
            key={index}
            type="button"
            className="inline-flex flex-col items-center justify-center font-medium px-5 hover:bg-gray-50 dark:hover:bg-green-700 group"
            onClick={item.onClick}
          >
            {item.icon}
            <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-white dark:group-hover:text-white">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
