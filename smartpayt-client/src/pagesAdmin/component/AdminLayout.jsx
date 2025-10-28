import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import nanglaeIcon from "../../assets/img/nanglaeicon.png"; // <-- ปรับ path ให้ถูกต้อง

// (ปรับปรุง) เปลี่ยนสี Hover/Active และเพิ่มความหนาตัวอักษร
const NavLink = ({ to, children, isActive }) => {
  const navigate = useNavigate();
  return (
    <li
      className={`mb-2 p-2 cursor-pointer rounded-lg px-4 py-3 w-full transition-colors duration-200 ${
        isActive ? 'bg-green-800 font-semibold' : 'hover:bg-green-600' // <-- แก้ไขสี
      }`}
      onClick={() => navigate(to)}
    >
      {children}
    </li>
  );
};

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  // ... (Logic การเปิด/ปิด Dropdown เหมือนเดิม) ...
  const isBillGroupActive = useMemo(
    () => currentPath.startsWith('/admin/debt') || currentPath.startsWith('/admin/payment-slips'),
    [currentPath]
  );
  const isVerifyGroupActive = useMemo(
    () => currentPath.startsWith('/admin/verified-user') || currentPath.startsWith('/admin/verified-address'),
    [currentPath]
  );
  const [isBillDropdownOpen, setIsBillDropdownOpen] = useState(isBillGroupActive);
  const [isVerifyDropdownOpen, setIsVerifyDropdownOpen] = useState(isVerifyGroupActive);
  useEffect(() => setIsBillDropdownOpen(isBillGroupActive), [isBillGroupActive]);
  useEffect(() => setIsVerifyDropdownOpen(isVerifyGroupActive), [isVerifyGroupActive]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    // 1. (แก้ไข) เปลี่ยนพื้นหลังเป็นสีเทาอ่อน และใช้ฟอนต์ Sarabun
    <div className="flex flex-col min-h-screen bg-gray-100" style={{ fontFamily: "'Sarabun', sans-serif" }}> 
      
      {/* 2. (แก้ไข) Header ใช้ฟอนต์ Sarabun (หรือลบ style ทิ้งถ้า index.css ทำงานแล้ว) */}
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

      <div className="flex h-[calc(100vh-88px)] relative overflow-hidden">
        {/* Sidebar */}
        <div 
          className={`absolute top-0 left-0 h-full bg-green-700 text-white p-5 transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } w-64 z-10`} 
        >
          <h2 className="text-xl font-bold mb-4">Smart Payt</h2>
          <ul className="flex flex-col">
            
            <NavLink to="/admin" isActive={currentPath === '/admin'}>
              หน้าหลัก
            </NavLink>
            <NavLink to="/admin/service" isActive={currentPath === '/admin/service'}>
              ข้อมูลผู้ใช้บริการ
            </NavLink>

            {/* ตรวจสอบบิลชำระ */}
            <li 
              className="mb-2 hover:bg-green-600 p-3 rounded-lg cursor-pointer px-4 py-3" // 3. (แก้ไข) ปรับสี Hover
              onClick={() => setIsBillDropdownOpen(!isBillDropdownOpen)}
            >
              <div className="flex justify-between items-center">
                <span>ตรวจสอบบิลชำระ</span>
                <svg className={`h-4 w-4 transform transition-transform ${isBillDropdownOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </li>
            <ul 
              className={`ml-4 overflow-hidden transition-all duration-300 ease-in-out ${
                isBillDropdownOpen ? 'max-h-40' : 'max-h-0'
              }`}
            >
              <NavLink to="/admin/debt" isActive={currentPath === '/admin/debt'}>
                ข้อมูลผู้ค้างชำระ
              </NavLink>
              <NavLink to="/admin/payment-slips" isActive={currentPath === '/admin/payment-slips'}>
                ตรวจสอบสลิป
              </NavLink>
            </ul>

            {/* ยืนยันสถานะผู้ใช้บริการ */}
            <li 
              className="mb-2 hover:bg-green-600 p-3 rounded-lg cursor-pointer px-4 py-3" // 4. (แก้ไข) ปรับสี Hover
              onClick={() => setIsVerifyDropdownOpen(!isVerifyDropdownOpen)}
            >
              <div className="flex justify-between items-center">
                <span>ยืนยันสถานะผู้ใช้บริการ</span>
                <svg className={`h-4 w-4 transform transition-transform ${isVerifyDropdownOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </li>
            <ul 
              className={`ml-4 overflow-hidden transition-all duration-300 ease-in-out ${
                isVerifyDropdownOpen ? 'max-h-40' : 'max-h-0'
              }`}
            >
              <NavLink to="/admin/verified-user" isActive={currentPath === '/admin/verified-user'}>
                ยืนยันข้อมูลผู้ใช้
              </NavLink>
              <NavLink to="/admin/verified-address" isActive={currentPath === '/admin/verified-address'}>
                ยืนยันข้อมูลครัวเรือน
              </NavLink>
            </ul>
            
            <NavLink to="/admin/report" isActive={currentPath === '/admin/report'}>
              รายงาน
            </NavLink>
          </ul>

          <div className="absolute bottom-5 left-0 right-0 flex justify-center">
            {/* 5. (แก้ไข) เปลี่ยนปุ่ม Logout เป็นสีแดง (Danger/Action) */}
            <button
              className="bg-red-600 text-white px-7 py-3 rounded-lg shadow-md max-w-[90%] hover:bg-red-700 transition-colors"
              onClick={() => {
                localStorage.removeItem("Admin_token");
                navigate("/adminlogin");
              }}
            >
              ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Content */}
        <div 
          className={`flex-1 p-5 overflow-auto transition-all duration-300 ease-in-out w-full ${
            isSidebarOpen ? 'ml-64' : 'ml-0'
          }`}
        >
          {children} 
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;