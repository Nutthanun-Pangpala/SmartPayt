import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import axios from 'axios';
import nanglaeIcon from "../assets/img/nanglaeicon.png";


const Report = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isBillingDropdownOpen, setIsBillingDropdownOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleWasteReport = async () => {
    try {
      const token = localStorage.getItem('Admin_token');
      const response = await axios.get('http://localhost:3000/admin/stats-waste-daily', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Waste Report');

      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });
      const fileData = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(fileData, 'waste_report.xlsx');
    } catch (error) {
      console.error('Error generating waste report:', error);
      alert('ไม่สามารถดึงข้อมูลรายงานปริมาณขยะได้');
    }
  };

  const handleFinanceReport = async () => {
  try {
    const token = localStorage.getItem('Admin_token');
    const response = await axios.get('http://localhost:3000/admin/report/export-finance', {
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const fileData = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(fileData, 'finance_report.xlsx');
  } catch (error) {
    console.error('Error generating finance report:', error);
    alert('ไม่สามารถดึงข้อมูลรายงานทางการเงินได้');
  }
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
        <div className={`relative ${isSidebarOpen ? "w-1/5" : "w-0 opacity-0"} bg-green-700 p-5 text-white transition-all`}>
          <div className={`${isSidebarOpen ? "opacity-100" : "opacity-0"} transition-opacity`}>
            <h2 className="text-xl font-bold mb-4">Smart Payt</h2>
            <ul>
              <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3" onClick={() => navigate('/admin')}>หน้าหลัก</li>
              <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3" onClick={() => navigate('/admin/service')}>ข้อมูลผู้ใช้บริการ</li>
              <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3" onClick={() => navigate('/admin/debt')}>ข้อมูลผู้ค้างชำระค่าบริการ</li>
              <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
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
              <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => setIsBillingDropdownOpen(!isBillingDropdownOpen)}>
                <div className="flex justify-between items-center">
                    <span>การจัดการบิลและขยะ</span>
                    <svg
                    className={`h-4 w-4 transform transition-transform ${isBillingDropdownOpen ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                        </div>
                        </li>
                        {isBillingDropdownOpen && (
                            <ul className="ml-4">
                                <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin/bills')}>
                                    สร้างใบแจ้งหนี้
                                    </li>
                                    <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin/editwaste')}>
                                        กำหนดราคาประเภทขยะ </li>
                                        </ul>
                                    )}
                                    <li className="mb-2 p-2 bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin/report')}>รายงาน</li>
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

        {/* Main Content */}
        <div className="flex-1 p-5 transition-all duration-300 ease-in-out overflow-auto">
 <div className="flex-1 p-5 transition-all duration-300 ease-in-out overflow-auto">
  <h1 className="text-3xl font-bold text-gray-900 mb-6">รายงาน</h1>

    <div className="space-y-4">
      <button
  onClick={handleFinanceReport}
  className="w-full text-left px-6 py-4 bg-[#dedbfa] hover:bg-[#c7c3f2] text-black text-lg font-semibold rounded-md transition duration-200">
    รายงานทางการเงิน
    </button>
    <button
    onClick={handleWasteReport} className="w-full text-left px-6 py-4 bg-[#dedbfa] hover:bg-[#c7c3f2] text-black text-lg font-semibold rounded-md transition duration-200">
      รายงานปริมาณขยะ
      </button>
      </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;
