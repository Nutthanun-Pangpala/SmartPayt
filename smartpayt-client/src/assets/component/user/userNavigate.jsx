import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const lineUserId = localStorage.getItem("lineUserId");

  const items = [
    {
      label: "หน้าหลัก",
      iconClass: "fi fi-sr-home",
      to: "/UserDashboard",
    },
    {
      label: "ประวัติการชำระ",
      iconClass: "fi fi-ss-clock",
      to: lineUserId ? `/paymenthistory/${lineUserId}` : "/",
      needLogin: true,
    },
    {
      label: "ข้อมูลขยะ",
      iconClass: "fi fi-rr-chart-histogram",
      to: lineUserId ? `/wastedata/${lineUserId}` : "/",
      needLogin: true,
    },
  ];

  const handleNav = (item) => {
    if (item.needLogin && !lineUserId) {
      alert("ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินก่อน");
      navigate("/");
      return;
    }
    navigate(item.to);
  };

  // เช็ค active แบบง่าย: เทียบพาธขึ้นต้น
  const isActive = (to) => {
    const base = to.split("/:")[0]; // ตัดพารามิเตอร์แบบ :id
    return location.pathname.startsWith(base);
  };

  return (
    <>
      {/* Spacer กันคอนเทนต์โดน nav fixed ทับ (รองรับ safe-area) */}
      <div
        className="h-[calc(env(safe-area-inset-bottom)+56px)] md:h-[calc(env(safe-area-inset-bottom)+64px)]"
        aria-hidden
      />

      <nav
        role="navigation"
        aria-label="Bottom navigation"
        className="fixed bottom-0 inset-x-0 z-50 h-14 md:h-16 bg-white/95 backdrop-blur border-t border-gray-200 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="h-full max-w-md mx-auto grid grid-cols-3">
          {items.map((item, index) => {
            const active = isActive(item.to);
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleNav(item)}
                className={`relative inline-flex flex-col items-center justify-center gap-0.5 px-5
                  text-[11px] md:text-sm font-medium
                  ${active ? "text-green-600" : "text-gray-600"} hover:text-green-700`}
              >
                <i
                  className={`${item.iconClass} text-[18px] md:text-[20px]`}
                />
                <span>{item.label}</span>

                {/* แถบ active เล็กๆ ด้านบนไอเท็ม */}
                {active && (
                  <span className="absolute -top-0.5 h-0.5 w-8 rounded-full bg-green-600" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
