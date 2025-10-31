import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // อ่านค่า lineUserId ตอน render (จะอัปเดตเมื่อมีการ re-render เช่น ตอน navigate)
  const lineUserId = localStorage.getItem("lineUserId");

  const items = [
    {
      label: "หน้าหลัก",
      iconClass: "fi fi-sr-home",
      to: "/",
    },
    {
      label: "ประวัติการชำระ",
      iconClass: "fi fi-ss-clock",
      // 'to' path จะถูกสร้างตาม lineUserId ที่มี "ณ ตอน render"
      to: lineUserId ? `/paymenthistory/${lineUserId}` : "/",
      needLogin: true,
    },
    {
      label: "ข้อมูลขยะ",
      iconClass: "fi fi-rr-chart-histogram",
      // 'to' path จะถูกสร้างตาม lineUserId ที่มี "ณ ตอน render"
      to: lineUserId ? `/wastedata/${lineUserId}` : "/",
      needLogin: true,
    },
  ];

  // --- 👇 แก้ไขจุดที่ 1 (Stale State) 👇 ---
  const handleNav = (item) => {
    // อ่านค่า localStorage "ใหม่" ทุกครั้งที่คลิก เพื่อป้องกัน Stale State
    const currentLineUserId = localStorage.getItem("lineUserId");

    // 1. เช็คว่าต้อง Login หรือไม่ (ใช้ค่าที่อ่านมาล่าสุด)
    if (item.needLogin && !currentLineUserId) {
      alert("ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินก่อน");
      navigate("/userLogin");
      return;
    }

    // 2. สร้าง Path ปลายทาง
    let destination = item.to;

    // 3. ตรวจสอบเผื่อว่า 'item.to' เป็นค่าเก่า (เช่น "/")
    // แต่ตอนนี้เรา Login แล้ว (มี currentLineUserId)
    if (item.needLogin && currentLineUserId && item.to === "/") {
      // ให้สร้าง path ที่ถูกต้องขึ้นมาใหม่ โดยอิงจาก label
      if (item.label === "ประวัติการชำระ") {
        destination = `/paymenthistory/${currentLineUserId}`;
      } else if (item.label === "ข้อมูลขยะ") {
        destination = `/wastedata/${currentLineUserId}`;
      }
    }

    // 4. นำทางไปยัง path ที่ถูกต้อง
    navigate(destination);
  };
  // --- 👆 สิ้นสุดการแก้ไขจุดที่ 1 👆 ---


  // --- 👇 แก้ไขจุดที่ 2 (Active Check) 👇 ---
  const isActive = (to) => {
    // ถ้า 'to' คือ "/" (หน้าหลัก) ต้องเช็คแบบตรงตัว (exact match)
    if (to === "/") {
      return location.pathname === "/";
    }

    // สำหรับหน้าอื่นๆ ให้เช็คว่า path ขึ้นต้นด้วย 'to'
    const base = to.split("/:")[0];
    return location.pathname.startsWith(base);
  };
  // --- 👆 สิ้นสุดการแก้ไขจุดที่ 2 👆 ---

  return (
    <>
      {/* Spacer */}
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
            // ใช้ logic 'isActive' ที่แก้ไขแล้ว
            const active = isActive(item.to);
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleNav(item)} // ใช้ 'handleNav' ที่แก้ไขแล้ว
                className={`relative inline-flex flex-col items-center justify-center gap-0.5 px-5
                  text-[11px] md:text-sm font-medium
                  ${
                    active ? "text-green-600" : "text-gray-600"
                  } hover:text-green-700`}
              >
                <i
                  className={`${item.iconClass} text-[18px] md:text-[20px]`}
                />
                <span>{item.label}</span>

                {/* แถบ active */}
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