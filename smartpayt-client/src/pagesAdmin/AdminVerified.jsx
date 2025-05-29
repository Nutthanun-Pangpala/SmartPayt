import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import nanglaeIcon from "../assets/img/nanglaeicon.png";

const AdminVerified = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(true); // เปิดค้างไว้
    const navigate = useNavigate();

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white shadow">
                <div className="flex items-center">
                    <button onClick={toggleSidebar} className="text-gray-800 p-2 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <div className="flex items-center space-x-3">
                        <img src={nanglaeIcon} alt="nanglaeIcon" className="h-20" />
                        <h2 className="text-2xl font-bold text-gray-800">เทศบาลตำบลนางแล</h2>
                    </div>
                </div>
            </div>

            <div className="flex h-[calc(100vh-88px)]">
                {/* Sidebar */}
                <div className={`relative ${isSidebarOpen ? "w-1/5" : "w-0 opacity-0"} bg-green-700 p-5 text-white transition-all duration-300 ease-in-out overflow-hidden`}>
                    <div className={`${isSidebarOpen ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}>
                        <h2 className="text-xl font-bold mb-4">Smart Payt</h2>
                        <ul>
                            <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin')}>หน้าหลัก</li>
                            <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin/service')}>ข้อมูลผู้ใช้บริการ</li>
                            <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin/debt')}>ข้อมูลผู้ค้างชำระค่าบริการ</li>

                            <li className="mb-2 p-2 bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                <div className="flex justify-between items-center">
                                    <span>ยืนยันสถานะผู้ใช้บริการ</span>
                                    <svg className={`h-4 w-4 transform transition-transform ${isDropdownOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </li>

                            {isDropdownOpen && (
                                <ul className="ml-4">
                                    <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin/verified-user')}>ยืนยันข้อมูลผู้ใช้บริการ</li>
                                    <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin/verified-address')}>ยืนยันข้อมูลครัวเรือน</li>
                                </ul>
                            )}

                            <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin/bills')}>เพิ่มบิลชำระให้ผู้บริการ</li>
                            <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin/editwaste')}>ตั้งค่าการเก็บขยะแต่ละประเภท</li>
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
                </div>

            </div>
        </div>
    );
};

export default AdminVerified;
