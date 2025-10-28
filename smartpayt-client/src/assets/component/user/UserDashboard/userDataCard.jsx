import "@flaticon/flaticon-uicons/css/all/all.css";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const maskPhone = (val) => {
  if (!val) return "-";
  const digits = String(val).replace(/\D/g, "");
  if (digits.length !== 10) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-****`;
};

const initialsFromName = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] || "U").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
};

const UserDatacard = () => {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const lineUserId = useMemo(() => localStorage.getItem("lineUserId"), []);

  const fetchUser = async () => {
    if (!lineUserId) {
      navigate("/userLogin");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/${lineUserId}`
      );
      setUserData(res.data?.user || null);
    } catch (e) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:", e);
      setError("ไม่สามารถดึงข้อมูลผู้ใช้ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [lineUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="mx-3 mt-3 mb-4 rounded-2xl border shadow-sm bg-white overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-green-600 to-emerald-400" />
        <div className="p-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-2/3" />
            <div className="h-3 bg-gray-200 rounded w-3/5" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="mx-3 mt-3 mb-4 rounded-2xl border shadow-sm bg-white overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-red-600 to-rose-400" />
        <div className="p-4">
          <div className="text-red-600 mb-3">{error || "ไม่พบข้อมูลผู้ใช้"}</div>
          <button
            onClick={fetchUser}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 hover:bg-gray-50"
          >
            <i className="fi fi-rr-rotate-right" />
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  const avatar = initialsFromName(userData.name);

  return (
    <div className="mx-3 mt-3 mb-4 rounded-2xl border shadow-sm bg-white overflow-hidden">
      {/* แถบสีบน */}
      <div className="h-1.5 bg-gradient-to-r from-green-600 to-emerald-400" />

      <div className="p-4">
        {/* ส่วนหัว */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-green-600 text-white flex items-center justify-center text-lg font-bold">
            {avatar}
          </div>
          <div className="min-w-0">
            <div className="text-base md:text-lg font-semibold truncate">
              {userData.name || "-"}
            </div>
            <div className="text-gray-500 text-xs md:text-sm break-all">
              ID: {userData.lineUserId || "-"}
            </div>
          </div>
        </div>

        {/* รายละเอียด */}
        <div className="mt-3 space-y-2 text-sm md:text-base">
          <div className="flex items-start gap-2">
            <i className="fi fi-ss-phone-call mt-0.5 text-gray-500" />
            <div className="text-gray-600">
              <span className="text-gray-500 mr-1">เบอร์โทรศัพท์:</span>
              <span className="font-medium">{maskPhone(userData.Phone_No)}</span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <i className="fi fi-sr-envelope mt-0.5 text-gray-500" />
            <div className="text-gray-600">
              <span className="text-gray-500 mr-1">อีเมล:</span>
              {userData.Email ? (
                <a
                  href={`mailto:${userData.Email}`}
                  className="font-medium text-blue-600 hover:underline break-all"
                >
                  {userData.Email}
                </a>
              ) : (
                <span className="font-medium">-</span>
              )}
            </div>
          </div>
        </div>

        {/* ปุ่มไปจัดการบัญชี */}
        {/* <div className="mt-4">
          <button
            onClick={() => navigate("/account")}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium"
          >
            <i className="fi fi-rr-pencil" />
            แก้ไขข้อมูล
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default UserDatacard;
