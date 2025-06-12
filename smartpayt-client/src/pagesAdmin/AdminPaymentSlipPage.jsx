import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import nanglaeIcon from "../assets/img/nanglaeicon.png";

const AdminSlipList = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isBillDropdownOpen, setIsBillDropdownOpen] = useState(true);
  const [isVerifyDropdownOpen, setIsVerifyDropdownOpen] = useState(false);
  const [isWasteDropdownOpen, setIsWasteDropdownOpen] = useState(false);
  const [slips, setSlips] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();



  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const fetchSlips = async () => {
    try {
      const res = await axios.get("/api/admin/payment-slips", {
        headers: { Authorization: `Bearer ${localStorage.getItem("Admin_token")}` },
      });
      setSlips(res.data);
    } catch (err) {
      console.error("ดึงข้อมูลสลปล้มเหลว:", err);
      if (err.response?.status === 401) {
        alert("กรุณาเข้าสู่ระบบใหม่");
        navigate("/adminlogin");
      }
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`/api/admin/payment-slips/${id}`, { status }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("Admin_token")}` },
      });
      fetchSlips();
    } catch (err) {
      console.error("❌ อัปเดตสถานะล้มเหลว:", err);
    }
  };

  useEffect(() => {
    fetchSlips();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#FDEFB2]">
      <div className="flex items-center justify-between p-4 bg-white shadow">
              <div className="flex items-center">
                <button onClick={toggleSidebar} className="text-gray-800 p-2 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="flex items-center space-x-3">
                  <img src={nanglaeIcon} alt="icon" className="h-20" />
                  <h2 className="text-2xl font-bold text-gray-800">เทศบาลตำบลนางแล</h2>
                </div>
              </div>
            </div>

      <div className="flex h-[calc(100vh-88px)]">
        <div className={`relative ${isSidebarOpen ? "w-1/5" : "w-0"} bg-green-700 text-white p-5 transition-all overflow-hidden`}>
          <h2 className="text-xl font-bold mb-4">Smart Payt</h2>
          <ul>
            <li className="mb-2 hover:bg-green-900 p-3 rounded cursor-pointer rounded px-4 py-3" onClick={() => navigate("/admin")}>หน้าหลัก</li>
            <li className="mb-2 hover:bg-green-900 p-3 rounded cursor-pointer rounded px-4 py-3" onClick={() => navigate("/admin/service")}>ข้อมูลผู้ใช้บริการ</li>
           {/* ตรวจสอบบิลชำระ */}
            <li className="mb-2 hover:bg-green-900 p-3 rounded cursor-pointer rounded px-4 py-3" onClick={() => setIsBillDropdownOpen(!isBillDropdownOpen)}>
              <div className="flex justify-between items-center">
                <span>ตรวจสอบบิลชำระ</span>
                <svg className={`h-4 w-4 transform transition-transform ${isBillDropdownOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
              </div>
            </li>
            {isBillDropdownOpen && (
              <ul className="ml-4">
                <li className="mb-2 hover:bg-green-900 p-3 rounded cursor-pointer rounded px-4 py-3" onClick={() => navigate("/admin/debt")}>ข้อมูลผู้ค้างชำระ</li>
                <li className="mb-2 p-2 bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate("/admin/payment-slips")}>ตรวจสอบสลิป</li>
              </ul>
            )}

            {/* ยืนยันสถานะผู้ใช้บริการ */}
            <li className="mb-2 hover:bg-green-900 p-3 rounded cursor-pointer rounded px-4 py-3" onClick={() => setIsVerifyDropdownOpen(!isVerifyDropdownOpen)}>
              <div className="flex justify-between items-center">
                <span>ยืนยันสถานะผู้ใช้บริการ</span>
                <svg className={`h-4 w-4 transform transition-transform ${isVerifyDropdownOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
              </div>
            </li>
            {isVerifyDropdownOpen && (
              <ul className="ml-4">
                <li className="mb-2 hover:bg-green-900 p-3 rounded cursor-pointer rounded px-4 py-3" onClick={() => navigate("/admin/verified-user")}>ยืนยันข้อมูลผู้ใช้</li>
                <li className="mb-2 hover:bg-green-900 p-3 rounded cursor-pointer rounded px-4 py-3" onClick={() => navigate("/admin/verified-address")}>ยืนยันข้อมูลครัวเรือน</li>
              </ul>
            )}

            {/* การจัดการบิลและขยะ */}
            <li className="mb-2 hover:bg-green-900 p-3 rounded cursor-pointer rounded px-4 py-3" onClick={() => setIsWasteDropdownOpen(!isWasteDropdownOpen)}>
              <div className="flex justify-between items-center">
                <span>การจัดการบิลและขยะ</span>
                <svg className={`h-4 w-4 transform transition-transform ${isWasteDropdownOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
              </div>
            </li>
            {isWasteDropdownOpen && (
              <ul className="ml-4">
                <li className="mb-2 hover:bg-green-900 p-3 rounded cursor-pointer rounded px-4 py-3" onClick={() => navigate("/admin/bills")}>สร้างใบแจ้งหนี้</li>
                <li className="mb-2 hover:bg-green-900 p-3 rounded cursor-pointer rounded px-4 py-3" onClick={() => navigate("/admin/editwaste")}>กำหนดราคาขยะ</li>
              </ul>
            )}
            <li className="mb-2 hover:bg-green-900 p-3 rounded cursor-pointer rounded px-4 py-3" onClick={() => navigate("/admin/report")}>รายงาน</li>
          </ul>
          <div className="absolute bottom-5 left-0 right-0 flex justify-center">
            <button className="bg-yellow-500 text-black px-7 py-3 rounded shadow-md max-w-[90%]" onClick={() => {
              localStorage.removeItem("Admin_token");
              navigate("/adminlogin");
            }}>
              ออกจากระบบ
            </button>
          </div>
        </div>

        <div className="flex-1 p-5 overflow-auto">
          <h1 className="text-3xl font-bold mb-6">📤 รายการสลิปที่ส่งเข้ามา</h1>
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="w-full border text-sm">
              <thead className="bg-[#F7D488] text-[#4B5320]">
                <tr>
                  <th className="p-2 text-left">ชื่อ</th>
                  <th className="p-2 text-left">ที่อยู่</th>
                  <th className="p-2 text-right">ยอด</th>
                  <th className="p-2 text-left">เวลา</th>
                  <th className="p-2 text-center">สลิป</th>
                  <th className="p-2 text-center">สถานะ</th>
                  <th className="p-2 text-center">ตรวจสอบ</th>
                </tr>
              </thead>
              <tbody>
                {slips.map((slip) => (
                  <tr key={slip.id} className="border-t hover:bg-[#fffbe3]">
                    <td className="p-2">{slip.name}</td>
                    <td className="p-2">{`${slip.house_no}, ${slip.sub_district}, ${slip.district}`}</td>
                    <td className="p-2 text-right">{slip.amount_due} ฿</td>
                    <td className="p-2">{new Date(slip.uploaded_at).toLocaleString()}</td>
                    <td className="p-2 text-center">
                      <button className="text-blue-600 hover:underline" onClick={() => setPreviewImage(`http://localhost:3000/${slip.image_path.replace(/\\/g, "/")}`)}>ดูสลิป</button>
                    </td>
                    <td className="p-2 text-center font-semibold">
                      {slip.status === "approved" ? (
                        <span className="text-green-600">✅ ผ่าน</span>
                      ) : slip.status === "rejected" ? (
                        <span className="text-red-600">❌ ไม่ผ่าน</span>
                      ) : (
                        <span className="text-yellow-600">🕓 รอตรวจสอบ</span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      {slip.status === "pending" ? (
                        <>
                          <button onClick={() => updateStatus(slip.id, "approved")} className="text-green-600 hover:underline mr-2">ผ่าน</button>
                          <button onClick={() => updateStatus(slip.id, "rejected")} className="text-red-600 hover:underline">ไม่ผ่าน</button>
                        </>
                      ) : (
                        <span className="text-gray-400">ตรวจสอบแล้ว</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {previewImage && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={() => setPreviewImage(null)}>
              <div className="relative bg-white p-4 rounded shadow-lg" onClick={(e) => e.stopPropagation()}>
                <button className="absolute top-2 right-2 text-gray-600 text-xl hover:text-red-600" onClick={() => setPreviewImage(null)}>✕</button>
                <img src={previewImage} alt="สลิป" className="max-w-[90vw] max-h-[80vh] rounded" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSlipList;