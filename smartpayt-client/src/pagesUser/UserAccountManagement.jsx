import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import NavbarComponent from "../assets/component/user/userNavbar";
import BottomNav from "../assets/component/user/userNavigate";

export default function AccountManagement() {
  const [account, setAccount] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const [formData, setFormData] = useState({
    lineUserId: "",
    name: "",
    ID_card_No: "",
    Phone_No: "",
    Email: "",
  });

  const lineUserIdLS = useMemo(() => localStorage.getItem("lineUserId") || "", []);

  useEffect(() => {
    if (!lineUserIdLS) return;
    (async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/user/${lineUserIdLS}`);
        const user = res.data?.user || res.data || {};
        setAccount(user);
        setFormData({
          lineUserId: user.lineUserId || lineUserIdLS,
          name: user.name || "",
          ID_card_No: user.ID_card_No || "",
          Phone_No: user.Phone_No || "",
          Email: user.Email || "",
        });
        setError("");
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("โหลดข้อมูลผู้ใช้ไม่สำเร็จ");
      }
    })();
  }, [lineUserIdLS]);

  const startEdit = () => setEditing(true);
  const cancelEdit = () => {
    setEditing(false);
    if (account) {
      setFormData({
        lineUserId: account.lineUserId || lineUserIdLS,
        name: account.name || "",
        ID_card_No: account.ID_card_No || "",
        Phone_No: account.Phone_No || "",
        Email: account.Email || "",
      });
    }
  };

  // ตรวจความถูกต้องแบบง่าย
  const validate = () => {
    const errs = [];
    if (!formData.name.trim()) errs.push("กรุณากรอกชื่อ");
    if (formData.ID_card_No && !/^\d{13}$/.test(formData.ID_card_No)) errs.push("เลขบัตรประชาชนต้องมี 13 หลัก");
    if (formData.Phone_No && !/^\d{10}$/.test(formData.Phone_No)) errs.push("เบอร์โทรศัพท์ต้องมี 10 หลัก");
    if (formData.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) errs.push("อีเมลไม่ถูกต้อง");
    return errs;
  };

  const saveEdit = async () => {
    const errs = validate();
    if (errs.length) {
      alert(errs[0]);
      return;
    }
    try {
      setSaving(true);
      await axios.put(
        `http://localhost:3000/api/userupdateAccout/${formData.lineUserId}`,
        formData
      );
      setAccount(formData);
      setEditing(false);
      alert("บันทึกข้อมูลสำเร็จ");
    } catch (err) {
      console.error("Error updating account:", err);
      alert("แก้ไขข้อมูลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const initials = useMemo(() => {
    const n = (formData.name || "").trim();
    if (!n) return "U";
    const parts = n.split(/\s+/);
    const first = parts[0]?.[0] || "";
    const second = parts[1]?.[0] || "";
    return (first + second).toUpperCase() || first.toUpperCase() || "U";
  }, [formData.name]);

  if (!account) {
    return (
      <div className="min-h-screen bg-white">
        <NavbarComponent />
        <div className="max-w-screen-sm mx-auto px-4 md:px-6 pt-8 pb-24 text-center text-gray-600">
          กำลังโหลดข้อมูล...
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <NavbarComponent />

      <div
        className="mx-auto w-full max-w-screen-sm md:max-w-2xl px-4 md:px-6 pt-6 pb-24"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 6rem)" }}
      >
        <h1 className="text-center text-2xl md:text-3xl font-bold tracking-tight">
          จัดการบัญชีผู้ใช้
        </h1>

        {/* โปรไฟล์การ์ด */}
        <div className="mt-6 rounded-2xl border shadow-sm p-4 md:p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl md:text-2xl font-bold">
              {initials}
            </div>
            <div className="flex-1">
              <div className="text-lg md:text-xl font-semibold">{account?.name || "-"}</div>
              <div className="text-gray-500 text-sm break-all">ID: {account?.lineUserId || "-"}</div>
            </div>
            {!editing ? (
              <button
                onClick={startEdit}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 active:scale-[.98]"
              >
                <i className="fi fi-rr-pencil" />
                แก้ไข
              </button>
            ) : null}
          </div>

          {/* ฟอร์ม */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ชื่อ */}
            <div className="col-span-1">
              <label className="block text-sm text-gray-600 mb-1">ชื่อ</label>
              <input
                type="text"
                value={formData.name}
                readOnly={!editing}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ชื่อ-นามสกุล"
                className={`w-full rounded-lg border px-3 py-2 ${
                  editing ? "bg-white" : "bg-gray-50"
                }`}
              />
            </div>

            {/* เลขบัตรประชาชน */}
            <div className="col-span-1">
              <label className="block text-sm text-gray-600 mb-1">รหัสประจำตัวประชาชน</label>
              <input
                type="text"
                value={formData.ID_card_No}
                readOnly={!editing}
                inputMode="numeric"
                maxLength={13}
                onChange={(e) =>
                  setFormData({ ...formData, ID_card_No: e.target.value.replace(/\D/g, "") })
                }
                placeholder="กรอก 13 หลัก"
                className={`w-full rounded-lg border px-3 py-2 ${
                  editing ? "bg-white" : "bg-gray-50"
                }`}
              />
            </div>

            {/* เบอร์โทรศัพท์ */}
            <div className="col-span-1">
              <label className="block text-sm text-gray-600 mb-1">เบอร์โทรศัพท์</label>
              <input
                type="text"
                value={formData.Phone_No}
                readOnly={!editing}
                inputMode="numeric"
                maxLength={10}
                onChange={(e) =>
                  setFormData({ ...formData, Phone_No: e.target.value.replace(/\D/g, "") })
                }
                placeholder="กรอก 10 หลัก"
                className={`w-full rounded-lg border px-3 py-2 ${
                  editing ? "bg-white" : "bg-gray-50"
                }`}
              />
            </div>

            {/* อีเมล */}
            <div className="col-span-1">
              <label className="block text-sm text-gray-600 mb-1">อีเมล</label>
              <input
                type="email"
                value={formData.Email}
                readOnly={!editing}
                onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                placeholder="name@example.com"
                className={`w-full rounded-lg border px-3 py-2 ${
                  editing ? "bg-white" : "bg-gray-50"
                }`}
              />
            </div>
          </div>

          {/* ข้อความผิดพลาด */}
          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

          {/* ปุ่มจัดการ */}
          <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
            {editing ? (
              <>
                <button
                  onClick={cancelEdit}
                  className="rounded-lg border px-4 py-2 hover:bg-gray-50"
                  disabled={saving}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={saveEdit}
                  className={`rounded-lg px-4 py-2 text-white ${
                    saving ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                  }`}
                  disabled={saving}
                >
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
