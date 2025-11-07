import { useEffect, useMemo, useState } from 'react'; // ✅ Import useState ถูกต้องแล้ว
import { useLocation, useNavigate } from 'react-router-dom';
import nanglaeIcon from "../../assets/img/nanglaeicon.png";

// --- SVG Icons (คงเดิม) ---
const IconHome = () => (
  <svg className="w-6 h-6 mr-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7-7-7 7v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9Z"/>
  </svg>
);
const IconUsers = () => (
  <svg className="w-6 h-6 mr-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 18">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11.5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1 5 0Z M4 11.5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1 5 0Zm12 3.5c0 .5-.5 1.5-2.5 1.5S11 15.5 11 15c0-1.5 2.5-3 5-3s5 1.5 5 3Zm-12 0c0 .5-.5 1.5-2.5 1.5S1 15.5 1 15c0-1.5 2.5-3 5-3s5 1.5 5 3Z"/>
  </svg>
);
const IconBilling = () => (
  <svg className="w-6 h-6 mr-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4h1.5L8 16m0 0h8m-8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm.75-3H7.5M11 7H6.312M17 4v6m-3-3h6"/>
  </svg>
);
const IconService = () => (
  <svg className="w-6 h-6 mr-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 3.338A1 1 0 0 1 8 4v1.659a1 1 0 0 1-1.21.988A5.942 5.942 0 0 0 5 6.559a1 1 0 0 1-1.21-.988V4a1 1 0 0 1 1-1 5.942 5.942 0 0 0 2-1.662ZM13 3.338A1 1 0 0 1 14 4v1.659a1 1 0 0 1-1.21.988A5.942 5.942 0 0 0 11 6.559a1 1 0 0 1-1.21-.988V4a1 1 0 0 1 1-1 5.942 5.942 0 0 0 2-1.662Zm-3 9.324A1 1 0 0 1 11 13v1.659a1 1 0 0 1-1.21.988A5.942 5.942 0 0 0 8 15.559a1 1 0 0 1-1.21-.988V13a1 1 0 0 1 1-1 5.942 5.942 0 0 0 2-1.662Z"/>
  </svg>
);
const IconReport = () => (
  <svg className="w-6 h-6 mr-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 20">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1v18h14V1H1Zm4 12h6m-6-4h6m-6-4h6M1 1h14v18H1V1Z"/>
  </svg>
);
// --- End SVG Icons ---


// NavLink (คงเดิม)
const NavLink = ({ to, children, isActive, isDisabled = false }) => {
  const navigate = useNavigate();
  
  const baseClasses = 'mb-2 p-2 rounded-lg px-4 py-2 w-full transition-colors duration-200';
  let statusClasses = '';
  
  if (isDisabled) {
    statusClasses = 'opacity-50 cursor-not-allowed';
  } else if (isActive) {
    statusClasses = 'bg-green-800 font-semibold cursor-pointer';
  } else {
    statusClasses = 'hover:bg-green-600 cursor-pointer';
  }

  return (
    <li
      className={`${baseClasses} ${statusClasses}`}
      onClick={() => !isDisabled && navigate(to)}
    >
      {children}
    </li>
  );
};

// DropdownHeader (คงเดิม)
const DropdownHeader = ({ children, isOpen, onClick, isDisabled = false }) => {
  const baseClasses = 'mb-2 p-3 rounded-lg cursor-pointer px-4 py-3';
  const statusClasses = isDisabled 
    ? 'opacity-50 cursor-not-allowed' 
    : 'hover:bg-green-600';

  return (
    <li
      className={`${baseClasses} ${statusClasses}`}
      onClick={() => !isDisabled && onClick()}
    >
      <div className="flex justify-between items-center">
        <span className="flex items-center">{children}</span>
        <svg className={`h-4 w-4 transform transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </li>
  );
};

// DropdownMenu (คงเดิม)
const DropdownMenu = ({ isOpen, children }) => (
  <ul
    className={`ml-4 overflow-hidden transition-all duration-300 ease-in-out ${
      isOpen ? 'max-h-60' : 'max-h-0' 
    }`}
  >
    {children}
  </ul>
);

// --- 🔑 ฟังก์ชันสำหรับดึง Role และ Logic การเข้าถึง ---

const getUserRole = () => {
  // ดึง Role จาก Local Storage 
  return localStorage.getItem('user_role') || 'collector'; 
};

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState(getUserRole());
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  // 1. Logic สำหรับตรวจสอบสิทธิ์
  const canAccess = (allowedRoles) => allowedRoles.includes(userRole);

  // 2. กำหนดสิทธิ์แต่ละกลุ่มตาม requirement ใหม่
  const access = useMemo(() => ({
    // จัดการผู้ใช้ (Staff, Super Admin)
    userGroup: canAccess(['super-admin', 'staff']), 
    // จัดการบิล (Staff, Accountant, Super Admin)
    billGroup: canAccess(['super-admin', 'staff', 'accountant']), 
    
    // ⚠️ ใช้สำหรับ Disabled Header เท่านั้น (เปิดเมื่อมีสิทธิ์อย่างน้อย 1 รายการ)
    settingGroupHeader: canAccess(['super-admin', 'staff', 'accountant', 'collector']), 

    // สิทธิ์ย่อยสำหรับเมนู Setting
    // ราคาขยะ (Super Admin เท่านั้น)
    priceSetting: canAccess(['super-admin']), 
    
    // ✅ [แก้ไข]: นำ 'staff' ออกจากสิทธิ์สร้างบิล (Manual)
    manualBill: canAccess(['super-admin', 'accountant']), // เหลือแค่ Super Admin และ Accountant เท่านั้น
    
    // สแกนชั่งน้ำหนัก (Collector, Super Admin)
    scan: canAccess(['super-admin', 'collector']), 
    
    // รายงาน (Staff, Accountant, Super Admin)
    report: canAccess(['super-admin', 'staff', 'accountant']),
  }), [userRole]);


  // --- Logic การเปิด/ปิด Dropdown (เหมือนเดิม) ---
  
  const isUserGroupActive = useMemo(
    () => access.userGroup && (currentPath.startsWith('/admin/service') || 
          currentPath.startsWith('/admin/verified-user') || 
          currentPath.startsWith('/admin/verified-address')),
    [currentPath, access.userGroup]
  );
  
  const isBillGroupActive = useMemo(
    () => access.billGroup && (currentPath.startsWith('/admin/debt') || 
          currentPath.startsWith('/admin/payment-slips')),
    [currentPath, access.billGroup]
  );

  const isSettingGroupActive = useMemo(
    () => access.settingGroupHeader && (currentPath.startsWith('/admin/household') || 
          currentPath.startsWith('/admin/establishment') || 
          currentPath.startsWith('/admin/bills') ||
          currentPath.startsWith('/admin/scan')),
    [currentPath, access.settingGroupHeader]
  );

  // 2. State ของแต่ละ Dropdown
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(isUserGroupActive);
  const [isBillDropdownOpen, setIsBillDropdownOpen] = useState(isBillGroupActive);
  const [isSettingDropdownOpen, setIsSettingDropdownOpen] = useState(isSettingGroupActive);

  // 3. Effect: เปิด Dropdown อัตโนมัติเมื่อเข้าหน้ารูก
  useEffect(() => setIsUserDropdownOpen(isUserDropdownOpen), [isUserDropdownOpen]);
  useEffect(() => setIsBillDropdownOpen(isBillDropdownOpen), [isBillDropdownOpen]);
  useEffect(() => setIsSettingDropdownOpen(isSettingDropdownOpen), [isSettingDropdownOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  // ⚠️ [สำคัญ] การดึง Role เมื่อ Component โหลด
  useEffect(() => {
    setUserRole(getUserRole());
  }, []); 

  return (
    <div className="flex flex-col min-h-screen bg-gray-100" style={{ fontFamily: "'Sarabun', sans-serif" }}> 
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white shadow sticky top-0 z-20">
        <div className="flex items-center">
          <button onClick={toggleSidebar} className="text-gray-800 p-2 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center space-x-3">
            <img src={nanglaeIcon} alt="icon" className="h-12 md:h-20 rounded-lg" />
            <h2 className="text-lg md:text-2xl font-bold text-gray-800">เทศบาลตำบลนางแล ({userRole})</h2>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-88px)] relative overflow-hidden">
        {/* Sidebar */}
        <div 
          className={`absolute top-0 left-0 h-full bg-green-700 text-white p-5 transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } w-64 z-10 overflow-y-auto pb-20`} 
        >
          <h2 className="text-xl font-bold mb-4">Smart Payt</h2>
          <ul className="flex flex-col">
            
            {/* 1. หน้าหลัก (เข้าได้ทุกคน) */}
            <NavLink to="/admin" isActive={currentPath === '/admin'}>
              <span className="flex items-center"><IconHome /> หน้าหลัก</span>
            </NavLink>

            {/* 2. จัดการผู้ใช้ */}
            <DropdownHeader 
              isOpen={isUserDropdownOpen} 
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              isDisabled={!access.userGroup} 
            >
              <IconUsers /> จัดการผู้ใช้
            </DropdownHeader>
            <DropdownMenu isOpen={isUserDropdownOpen && access.userGroup}> 
              <NavLink to="/admin/service" isActive={currentPath === '/admin/service'} isDisabled={!access.userGroup}>
                ข้อมูลผู้ใช้บริการ
              </NavLink>
              <NavLink to="/admin/verified-user" isActive={currentPath === '/admin/verified-user'} isDisabled={!access.userGroup}>
                ยืนยันข้อมูลผู้ใช้
              </NavLink>
              <NavLink to="/admin/verified-address" isActive={currentPath === '/admin/verified-address'} isDisabled={!access.userGroup}>
                ยืนยันข้อมูลครัวเรือน
              </NavLink>
            </DropdownMenu>

            {/* 3. จัดการบิล */}
            <DropdownHeader 
              isOpen={isBillDropdownOpen} 
              onClick={() => setIsBillDropdownOpen(!isBillDropdownOpen)}
              isDisabled={!access.billGroup} 
            >
              <IconBilling /> จัดการบิล
            </DropdownHeader>
            <DropdownMenu isOpen={isBillDropdownOpen && access.billGroup}>
              <NavLink to="/admin/debt" isActive={currentPath === '/admin/debt'} isDisabled={!access.billGroup}>
                ข้อมูลผู้ค้างชำระ
              </NavLink>
              <NavLink to="/admin/payment-slips" isActive={currentPath === '/admin/payment-slips'} isDisabled={!access.billGroup}>
                ตรวจสอบสลิป
              </NavLink>
            </DropdownMenu>

            {/* 4. ตั้งค่าบริการ */}
            <DropdownHeader 
              isOpen={isSettingDropdownOpen} 
              onClick={() => setIsSettingDropdownOpen(!isSettingDropdownOpen)}
              isDisabled={!access.settingGroupHeader} 
            >
              <IconService /> ตั้งค่าบริการ
            </DropdownHeader>
            
            <DropdownMenu isOpen={isSettingDropdownOpen && access.settingGroupHeader}>
              {/* ราคาขยะ (Super Admin เท่านั้น) */}
              <NavLink to="/admin/household" isActive={currentPath === '/admin/household'} isDisabled={!access.priceSetting}>
                ราคาขยะ (ครัวเรือน)
              </NavLink>
              <NavLink to="/admin/establishment" isActive={currentPath === '/admin/establishment'} isDisabled={!access.priceSetting}>
                ราคาขยะ (สถานประกอบการ)
              </NavLink>
              {/* สร้างบิล (Manual) (เหลือแค่ Super Admin และ Accountant) */}
              <NavLink to="/admin/bills" isActive={currentPath === '/admin/bills'} isDisabled={!access.manualBill}>
                สร้างบิล (Manual)
              </NavLink>
              {/* สแกนชั่งน้ำหนัก (Collector, Super Admin) */}
              <NavLink to="/admin/scan" isActive={currentPath === '/admin/scan'} isDisabled={!access.scan}>
                สแกนชั่งน้ำหนักขยะ
              </NavLink>

            </DropdownMenu>
            
            {/* 5. รายงาน (Staff, Accountant, Super Admin) */}
            <NavLink to="/admin/report" isActive={currentPath === '/admin/report'} isDisabled={!access.report}>
              <span className="flex items-center"><IconReport /> รายงาน</span>
            </NavLink>
          </ul>

          <div className="absolute bottom-5 left-0 right-0 flex justify-center">
            <button
              className="bg-red-600 text-white px-7 py-3 rounded-lg shadow-md max-w-[90%] hover:bg-red-700 transition-colors"
              onClick={() => {
                localStorage.removeItem("Admin_token");
                localStorage.removeItem("user_role");
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