import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import nanglaeIcon from "../assets/img/nanglaeicon.png";
import api from '../api';

const AdminVerified = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isBillDropdownOpen, setIsBillDropdownOpen] = useState(false);
  const [isVerifyDropdownOpen, setIsVerifyDropdownOpen] = useState(true);

  const [pendingUsers, setPendingUsers] = useState(0);
  const [pendingAddresses, setPendingAddresses] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const navigate = useNavigate();
  const toggleSidebar = () => setIsSidebarOpen(v => !v);

  // guard: ไม่มี token ให้เด้งไป login
  useEffect(() => {
    const t = localStorage.getItem('Admin_token');
    if (!t) navigate('/adminlogin');
  }, [navigate]);

  const fetchPendingCounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/pending-user');
      setPendingUsers(res.data?.pendingUsers ?? 0);
      setPendingAddresses(res.data?.pendingAddresses ?? 0);
      setMsg('');
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setMsg('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        localStorage.removeItem('Admin_token');
        navigate('/adminlogin');
      } else {
        setMsg(err.response?.data?.message || 'โหลดข้อมูลไม่สำเร็จ');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPendingCounts(); }, []);

  const handleLogout = () => {
    localStorage.removeItem('Admin_token');
    navigate('/adminlogin');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white shadow">
        <div className="flex items-center">
          <button onClick={toggleSidebar} className="text-gray-800 p-2 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center space-x-3">
            <img src={nanglaeIcon} alt="nanglaeIcon" className="h-20" />
            <h2 className="text-2xl font-bold text-gray-800">เทศบาลตำบลนางแล</h2>
          </div>
        </div>
        <button onClick={handleLogout} className="bg-yellow-500 text-black px-5 py-2 rounded shadow">
          ออกจากระบบ
        </button>
      </div>

      <div className="flex h-[calc(100vh-88px)]">
        {/* Sidebar */}
        <aside className={`relative ${isSidebarOpen ? "w-1/5" : "w-0 opacity-0"} bg-green-700 p-5 text-white transition-all duration-300 ease-in-out overflow-hidden`}>
          <div className={`${isSidebarOpen ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}>
            <h2 className="text-xl font-bold mb-4">Smart Payt</h2>
            <ul>
              <li className="mb-2 rounded px-4 py-3 hover:bg-green-900 cursor-pointer" onClick={() => navigate('/admin')}>หน้าหลัก</li>

              <li className="mb-2 rounded px-4 py-3 hover:bg-green-900 cursor-pointer" onClick={() => navigate('/admin/service')}>ข้อมูลผู้ใช้บริการ</li>

              <li className="mb-2 rounded px-4 py-3 hover:bg-green-900 cursor-pointer" onClick={() => setIsBillDropdownOpen(v => !v)}>
                <div className="flex justify-between items-center">
                  <span>ตรวจสอบบิลชำระ</span>
                  <svg className={`h-4 w-4 transform transition-transform ${isBillDropdownOpen ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </li>
              {isBillDropdownOpen && (
                <ul className="ml-4">
                  <li className="mb-2 rounded px-4 py-3 hover:bg-green-900 cursor-pointer" onClick={() => navigate('/admin/debt')}>ข้อมูลผู้ค้างชำระค่าบริการ</li>
                  <li className="mb-2 rounded px-4 py-3 hover:bg-green-900 cursor-pointer" onClick={() => navigate('/admin/payment-slips')}>ตรวจสอบสลิป</li>
                </ul>
              )}

              <li className="mb-2 rounded px-4 py-3 bg-green-900 cursor-pointer" onClick={() => setIsVerifyDropdownOpen(v => !v)}>
                <div className="flex justify-between items-center">
                  <span>ยืนยันสถานะผู้ใช้บริการ</span>
                  <svg className={`h-4 w-4 transform transition-transform ${isVerifyDropdownOpen ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </li>
              {isVerifyDropdownOpen && (
                <ul className="ml-4">
                  <li className="mb-2 rounded px-4 py-3 hover:bg-green-900 cursor-pointer" onClick={() => navigate('/admin/verified-user')}>ยืนยันข้อมูลผู้ใช้บริการ</li>
                  <li className="mb-2 rounded px-4 py-3 hover:bg-green-900 cursor-pointer" onClick={() => navigate('/admin/verified-address')}>ยืนยันข้อมูลครัวเรือน</li>
                </ul>
              )}
            </ul>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 p-5">
          <h1 className="text-3xl font-bold mb-6">ยืนยันสถานะผู้ใช้บริการ</h1>

          <div className="bg-white p-6 rounded-xl shadow max-w-2xl">
            <div className="flex items-center gap-6">
              <div>ผู้ใช้ที่รอยืนยัน: <b>{pendingUsers}</b></div>
              <div>ที่อยู่ที่รอยืนยัน: <b>{pendingAddresses}</b></div>
              <button
                onClick={fetchPendingCounts}
                className="ml-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                {loading ? 'กำลังโหลด…' : 'รีเฟรช'}
              </button>
            </div>
            {msg && <p className="mt-4 text-red-600">{msg}</p>}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminVerified;
