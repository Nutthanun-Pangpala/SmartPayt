import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../user/img/LogoNav.png";

function getInitials(name) {
  if (!name || typeof name !== "string") return "U";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const second = parts[1]?.[0] || "";
  return (first + second).toUpperCase() || "U";
}

const NavbarComponent = () => {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false); // ⬅️ โมดัลคอนเฟิร์ม
  const dropdownRef = useRef(null);
  const cancelBtnRef = useRef(null); // โฟกัสปุ่มยกเลิกตอนเปิดโมดัล
  const navigate = useNavigate();

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
    const onEsc = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setConfirmOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onEsc);
    };
  }, []);

  // ล็อคสกรีนเมื่อเปิดโมดัล
  useEffect(() => {
    document.body.style.overflow = confirmOpen ? "hidden" : "auto";
    if (confirmOpen) {
      setTimeout(() => cancelBtnRef.current?.focus(), 0);
    }
    return () => (document.body.style.overflow = "auto");
  }, [confirmOpen]);

  const doLogout = () => {
    localStorage.removeItem("lineUserId");
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("user");
    setConfirmOpen(false);
    setOpen(false);
    navigate("/");
  };

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

          {/* ปุ่มโปรไฟล์ */}
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
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 rounded-xl bg-white text-gray-800 shadow-xl ring-1 ring-black/5 overflow-hidden"
              >
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
                    onClick={() => setConfirmOpen(true)} // ⬅️ เปิดโมดัลคอนเฟิร์ม
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

      {/* Modal ยืนยันออกจากระบบ */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
                <i className="fi fi-rr-exit text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">ยืนยันการออกจากระบบ</h3>
                <p className="mt-1 text-sm text-gray-600">
                  คุณต้องการออกจากระบบ{displayName ? `ของ ${displayName}` : ""} ใช่หรือไม่?
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row sm:justify-end gap-2">
              <button
                ref={cancelBtnRef}
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border  bg-green-600  px-4 py-2 text-sm hover:bg-green-700 "
              >
                ยกเลิก
              </button>
              <button
                onClick={doLogout}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default NavbarComponent;
