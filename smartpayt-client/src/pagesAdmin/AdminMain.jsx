import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import nanglaeIcon from "../assets/img/nanglaeicon.png";
import { FaInfoCircle } from "react-icons/fa";

const AdminMain = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isBillingDropdownOpen, setIsBillingDropdownOpen] = useState(false);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAddress: 0,
    generalWaste: 0,
    hazardousWaste: 0,
    recycleWaste: 0,
  });
  const [wasteData, setWasteData] = useState([
    { name: "ขยะทั่วไป", value: 0 },
    { name: "ขยะอันตราย", value: 0 },
    { name: "ขยะรีไซเคิล", value: 0 },
  ]);
  const [pendingUsers, setPendingUsers] = useState(0);
  const [pendingAddresses, setPendingAddresses] = useState(0);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");

  const navigate = useNavigate();

  const COLORS = ["#0088FE", "#FF8042", "#00C49F"]; // สีสำหรับ pie chart

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // แปลงเดือนปีจาก "2025-05" เป็นรูปแบบไทย "พ.ค. 2568"
  const formatMonthLabel = (monthStr) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(year, Number(month) - 1);
    return date.toLocaleString("th-TH", { year: "numeric", month: "short" });
  };

  // ดึงเดือนที่มีข้อมูลขยะ
  useEffect(() => {
    const fetchAvailableMonths = async () => {
      try {
        const token = localStorage.getItem("Admin_token");
        if (!token) {
          navigate("/adminlogin");
          return;
        }
        const response = await axios.get(
          "http://localhost:3000/admin/waste-months",
          { headers: { authorization: `Bearer ${token}` } }
        );
        setAvailableMonths(response.data);
        if (response.data.length > 0) {
          setSelectedMonth(response.data[0]); // เลือกเดือนล่าสุดเป็น default
        }
      } catch (error) {
        console.error("Error fetching available months:", error);
      }
    };

    fetchAvailableMonths();
  }, [navigate]);

  // ดึงข้อมูลขยะตามเดือนที่เลือก
  useEffect(() => {
    if (!selectedMonth) return;

    const fetchWasteByMonth = async (month) => {
      try {
        const token = localStorage.getItem("Admin_token");
        if (!token) {
          navigate("/adminlogin");
          return;
        }

        const response = await axios.get(
          `http://localhost:3000/admin/waste-stats?month=${month}`,
          { headers: { authorization: `Bearer ${token}` } }
        );

        setWasteData(response.data);
      } catch (error) {
        console.error("Error fetching waste by month:", error);
      }
    };

    fetchWasteByMonth(selectedMonth);
  }, [selectedMonth, navigate]);

  // ดึงข้อมูลสถิติหลัก + ผู้รอยืนยัน
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("Admin_token");
        if (!token) {
          navigate("/adminlogin");
          return;
        }

        const [statsRes, pendingRes] = await Promise.all([
          axios.get("http://localhost:3000/admin/stats", {
            headers: { authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:3000/admin/pending-counts", {
            headers: { authorization: `Bearer ${token}` },
          }),
        ]);

        setStats(statsRes.data);
        setPendingUsers(pendingRes.data.pendingUsers);
        setPendingAddresses(pendingRes.data.pendingAddresses);
      } catch (error) {
        console.error("Error fetching stats:", error);
        if (error.response && error.response.status === 401) {
          navigate("/adminlogin");
        }
      }
    };

    fetchStats();
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-4 bg-white shadow">
        <div className="flex items-center">
          {/* Hamburger button */}
          <div className="mr-2">
            <button onClick={toggleSidebar} className="text-gray-800 p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
          {/* Logo + Title */}
          <div className="flex items-center space-x-3">
            <img src={nanglaeIcon} alt="nanglaeIcon" className="h-20" />
            <h2 className="text-2xl font-bold text-gray-800">เทศบาลตำบลนางแล</h2>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-88px)]">
        {/* Sidebar */}
        <div
          className={`relative ${
            isSidebarOpen ? "w-1/5" : "w-0 opacity-0"
          } bg-green-700 p-5 text-white transition-all duration-300 ease-in-out overflow-hidden`}
        >
          <div
            className={`${
              isSidebarOpen ? "opacity-100" : "opacity-0"
            } transition-opacity duration-300`}
          >
            <h2 className="text-xl font-bold mb-4">Smart Payt</h2>
            <ul>
              <li className="mb-2 p-2 bg-green-900 cursor-pointer rounded px-4 py-3 w-full">
                หน้าหลัก
              </li>
              <li
                className="mb-2 p-2 hover:bg-green-900 cursor-pointer px-4 py-3 rounded w-full"
                onClick={() => navigate("/admin/service")}
              >
                ข้อมูลผู้ใช้บริการ
              </li>
              <li
                className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                onClick={() => navigate("/admin/debt")}
              >
                ข้อมูลผู้ค้างชำระค่าบริการ
              </li>
              <li
                className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="flex justify-between items-center">
                  <span>ยืนยันสถานะผู้ใช้บริการ</span>
                  <svg
                    className={`h-4 w-4 transform transition-transform ${
                      isDropdownOpen ? "rotate-90" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </li>

              {isDropdownOpen && (
                <ul className="ml-4">
                  <li
                    className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                    onClick={() => navigate("/admin/verified-user")}
                  >
                    ยืนยันข้อมูลผู้ใช้บริการ
                  </li>
                  <li
                    className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                    onClick={() => navigate("/admin/verified-address")}
                  >
                    ยืนยันข้อมูลครัวเรือน
                  </li>
                </ul>
              )}
              <li
                className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                onClick={() => setIsBillingDropdownOpen(!isBillingDropdownOpen)}
              >
                <div className="flex justify-between items-center">
                  <span>การจัดการบิลและขยะ</span>
                  <svg
                    className={`h-4 w-4 transform transition-transform ${
                      isBillingDropdownOpen ? "rotate-90" : ""
                    }`}
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
                  <li
                    className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                    onClick={() => navigate("/admin/bills")}
                  >
                    สร้างใบแจ้งหนี้
                  </li>
                  <li
                    className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                    onClick={() => navigate("/admin/editwaste")}
                  >
                    กำหนดราคาประเภทขยะ
                  </li>
                </ul>
              )}
            </ul>
            <div className="absolute bottom-5 left-0 right-0 flex justify-center">
              <button
                className="bg-yellow-500 text-black px-7 py-3 rounded shadow-md max-w-[90%]"
                onClick={() => {
                  localStorage.removeItem("Admin_token");
                  navigate("/adminlogin");
                }}
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          className={`flex-1 p-5 transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "ml-1/5" : "lg:w-4/5 w-full ml-0"
          } overflow-auto`}
        >
          <h1 className="text-3xl font-bold mb-6 text-center lg:text-left">ข้อมูลภาพรวม</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Total Users & Pending */}
            <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">จำนวนผู้ใช้ลงทะเบียน</h2>
                <FaInfoCircle
                  title="จำนวนผู้ใช้ลงทะเบียน คือจำนวน user ที่มีการลงทะเบียนเข้ามาใช้บริการแอพเรา"
                  className="text-blue-600 cursor-pointer"
                  size={18}
                />
              </div>
              <p className="text-4xl font-bold text-blue-600">{stats.totalUsers}</p>
              <p className="text-gray-500">ผู้ใช้</p>

              <div className="flex items-center justify-between mt-4">
                <h2 className="text-xl font-semibold">จำนวนครัวเรือนที่ลงทะเบียน</h2>
                <FaInfoCircle
                  title="จำนวนครัวเรือนที่ลงทะเบียน คือจำนวนบ้านที่ได้ทำการลงทะเบียนเข้ามาในแอพเราแล้ว"
                  className="text-blue-600 cursor-pointer"
                  size={18}
                />
              </div>
              <p className="text-4xl font-bold text-blue-600">{stats.totalAddress}</p>
              <p className="text-gray-500">หลังคาเรือน</p>

              <div className="flex items-center justify-between mt-4">
                <h2 className="text-xl font-semibold">จำนวนผู้ใช้รอยืนยันตัวตน</h2>
                <FaInfoCircle
                  title="จำนวนผู้ใช้ที่รอการยืนยันตัวตน"
                  className="text-yellow-600 cursor-pointer"
                  size={18}
                />
              </div>
              <p className="text-4xl font-bold text-yellow-600">{pendingUsers}</p>
              <p className="text-gray-500">ผู้ใช้</p>

              <div className="flex items-center justify-between mt-4">
                <h2 className="text-xl font-semibold">จำนวนครัวเรือนรอยืนยันตัวตน</h2>
                <FaInfoCircle
                  title="จำนวนครัวเรือนที่รอการยืนยันตัวตน"
                  className="text-yellow-600 cursor-pointer"
                  size={18}
                />
              </div>
              <p className="text-4xl font-bold text-yellow-600">{pendingAddresses}</p>
              <p className="text-gray-500">หลังคาเรือน</p>
            </div>

            {/* Waste Distribution Chart */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">สัดส่วนปริมาณขยะ</h2>

              {/* ปฏิทินเลือกเดือนย้อนหลังเฉพาะเดือนที่มีข้อมูล */}
              <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold mb-4">เลือกเดือน</h2>
                <div className="grid grid-cols-4 gap-2">
                  {availableMonths.length === 0 && (
                    <p className="text-gray-500">ไม่มีข้อมูลเดือนใดให้แสดง</p>
                  )}
                  {availableMonths.map((month) => (
                    <button
                      key={month}
                      onClick={() => setSelectedMonth(month)}
                      className={`px-3 py-2 rounded cursor-pointer text-center border ${
                        selectedMonth === month
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {formatMonthLabel(month)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pie chart */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">สัดส่วนปริมาณขยะ</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={wasteData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {wasteData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Additional Stats */}
              <h2 className="text-xl font-bold my-6 text-center md:text-left">
                จำนวนการทิ้งขยะสะสม
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-2">ขยะทั่วไป</h3>
                  <p className="text-3xl font-bold text-blue-500">{stats.generalWaste}</p>
                  <p className="text-gray-500 mt-2">จำนวนการทิ้ง</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-2">ขยะอันตราย</h3>
                  <p className="text-3xl font-bold text-orange-500">{stats.hazardousWaste}</p>
                  <p className="text-gray-500 mt-2">จำนวนการทิ้ง</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-2">ขยะรีไซเคิล</h3>
                  <p className="text-3xl font-bold text-green-500">{stats.recycleWaste}</p>
                  <p className="text-gray-500 mt-2">จำนวนการทิ้ง</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMain;
