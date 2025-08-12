import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../user/img/LogoNav.png";

function getInitials(name) {
  if (!name || typeof name !== "string") return "U";
  // ตัดช่องว่างหลายตัว, เอาตัวแรกของคำ 1–2 คำ
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const second = parts[1]?.[0] || "";
  return (first + second).toUpperCase() || "U";
}

const NavbarComponent = () => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // ดึงชื่อผู้ใช้จาก localStorage (ลองสองรูปแบบ: userName หรือ user เป็น JSON)
  const displayName = useMemo(() => {
    const n1 = localStorage.getItem("userName");
    if (n1) return n1;
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      return user?.name || "";
    } catch {
      return "";
    }
  }, []);

  const initials = useMemo(() => getInitials(displayName), [displayName]);
  const lineUserId = useMemo(() => localStorage.getItem("lineUserId"), []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-gradient-to-r from-emerald-700 to-green-600 text-white shadow-md">
      <nav className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="h-16 md:h-20 flex items-center justify-between">
          <button
            onClick={() => navigate("/UserDashboard")}
            className="group flex items-center gap-3 focus:outline-none"
            aria-label="SmartPayt Home"
          >
            <img className="h-10 w-auto md:h-12" src={logo} alt="SmartPayt Logo" />
            <span className="text-lg md:text-2xl font-semibold tracking-wide">SmartPayt</span>
          </button>

          {/* ปุ่มโปรไฟล์ = ตัวย่อชื่อ */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="group inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 px-2.5 py-1.5 ring-1 ring-white/20 transition focus:outline-none focus:ring-2 focus:ring-white/60"
              aria-haspopup="menu"
              aria-expanded={open}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-700 font-bold shadow-sm">
                {initials}
              </span>
              <span className="hidden md:block text-sm font-medium">
                {displayName || "บัญชีของฉัน"}
              </span>
              <svg className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 011.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
              </svg>
            </button>

            {open && (
              <div role="menu" className="absolute right-0 mt-2 w-56 rounded-xl bg-white text-gray-800 shadow-xl ring-1 ring-black/5 overflow-hidden">
                <div className="px-4 py-3 border-b">
                  <p className="text-sm text-gray-500">เข้าสู่ระบบด้วย</p>
                  <p className="truncate font-medium">{displayName || "ผู้ใช้งาน"}</p>
                </div>
                <ul className="py-1 text-sm">
                  <li>
                    <button
                      className="flex w-full items-center gap-2 px-4 py-2 hover:bg-gray-50"
                      onClick={() => {
                        const id = lineUserId || localStorage.getItem("lineUserId");
                        if (id) navigate(`/accountmanagement/${id}`);
                        else navigate("/userLogin");
                        setOpen(false);
                      }}
                    >
                      <i className="fi fi-rr-user-pen text-emerald-600" />
                      จัดการบัญชี
                    </button>
                  </li>
                </ul>
                <div className="border-t">
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      localStorage.removeItem("lineUserId");
                      localStorage.removeItem("token");
                      localStorage.removeItem("userName");
                      localStorage.removeItem("user");
                      setOpen(false);
                      navigate("/");
                    }}
                  >
                    <i className="fi fi-rr-exit" />
                    ออกจากระบบ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default NavbarComponent;
