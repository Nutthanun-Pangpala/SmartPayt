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
      label: "ข้อมูลขยะ",
      icon: (
        <i className="fi fi-rr-chart-histogram text-gray-500  group-hover:text-white dark:group-hover:text-white"></i>
      ),
      onClick: () => {
        if (lineUserId) {
          navigate(`/wastedata/${lineUserId}`);
        } else {
          alert("ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินก่อน");
          // หรือ navigate ไปหน้า login
          navigate("/");
        }
      },
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
