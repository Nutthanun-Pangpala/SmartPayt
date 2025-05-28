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

const AdminMain = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAddress: 0,
    generalWaste: 0,
    hazardousWaste: 0,
    recycleWaste: 0,
  });
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("Admin_token");
        if (!token) {
          navigate("/adminlogin");
          return;
        }

        const response = await axios.get(
          "http://localhost:3000/admin/stats", {
          headers: {
            'Cache-Control': 'no-cache',
            'authorization': `Bearer ${token}`,
          }
        });

        setStats(response.data);
      } catch (error) {
        console.error("Error fetching stats:", error);
        if (error.response && error.response.status === 401) {
          navigate("/adminlogin");
        }
      }
    };

    fetchStats();
  }, [navigate]);

  const wasteData = [
    { name: "ขยะทั่วไป", value: stats.generalWaste },
    { name: "ขยะอันตราย", value: stats.hazardousWaste },
    { name: "ขยะรีไซเคิล", value: stats.recycleWaste },
  ];

  const COLORS = ["#0088FE", "#FF8042", "#00C49F"];

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
                ></path>
              </svg>
            </button>
          </div>
          {/* Logo + Title */}
          <div className="flex items-center space-x-3">
            <img src={nanglaeIcon} alt="nanglaeIcon" className="h-20" />
            <h2 className="text-2xl font-bold text-gray-800">
              เทศบาลตำบลนางแล
            </h2>
          </div>
          {/* User Profile */}
          <div className="flex items-center space-x-2 ml-auto">
            <img
              src="/user-profile.jpg"
              alt="Profile"
              className="h-10 w-10 rounded-full border"
            />
            <div>
              <p className="text-sm font-semibold text-gray-800">Admin</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-88px)]">
        {/* Sidebar */}
        <div
          className={`relative ${isSidebarOpen ? "w-1/5" : "w-0 opacity-0"
            } bg-green-700 p-5 text-white transition-all duration-300 ease-in-out overflow-hidden`}
        >
          <div
            className={`${isSidebarOpen ? "opacity-100" : "opacity-0"
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
              <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                onClick={() => navigate('/admin/users-verify')}>
                ยืนยันที่อยู่ผู้ใช้บริการ
              </li>
            </ul>
            <div className="absolute bottom-5 left-0 right-0 flex justify-center">
              <button
                className="bg-yellow-500 text-black px-7 py-3 rounded shadow-md max-w-[90%]"
                onClick={() => {
                  localStorage.removeItem("token");
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
          className={`flex-1 p-5 transition-all duration-300 ease-in-out ${isSidebarOpen ? "ml-1/5" : "lg:w-4/5 w-full ml-0"
            } overflow-auto`}
        >
          <h1 className="text-3xl font-bold mb-6 text-center lg:text-left">
            ข้อมูลภาพรวม
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Total Users Card */}
            <div className="bg-white p-6 rounded-lg shadow-md ">
              <div className=" m-2">
                <h2 className="text-xl font-semibold mb-4">
                  จำนวนผู้ใช้ลงทะเบียน
                </h2>
                <div className="flex">
                  <p className="text-4xl font-bold text-blue-600 mr-4">
                    {stats.totalUsers}
                  </p>
                  <p className="text-gray-500 mt-2">ผู้ใช้</p>
                </div>
              </div>
              <div className=" m-2">
                <h2 className="text-xl font-semibold mb-4">
                  จำนวนครัวเรือนที่ลงทะเบียน
                </h2>
                <div className="flex">
                  <p className="text-4xl font-bold text-blue-600 mr-4">
                    {stats.totalAddress}
                  </p>
                  <p className="text-gray-500 mt-2">หลังคาเรือน</p>
                </div>
              </div>
            </div>

            {/* Waste Distribution Chart */}
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
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">ขยะทั่วไป</h3>
              <p className="text-3xl font-bold text-blue-500">
                {stats.generalWaste}
              </p>
              <p className="text-gray-500 mt-2">จำนวนการทิ้ง</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">ขยะอันตราย</h3>
              <p className="text-3xl font-bold text-orange-500">
                {stats.hazardousWaste}
              </p>
              <p className="text-gray-500 mt-2">จำนวนการทิ้ง</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">ขยะรีไซเคิล</h3>
              <p className="text-3xl font-bold text-green-500">
                {stats.recycleWaste}
              </p>
              <p className="text-gray-500 mt-2">จำนวนการทิ้ง</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMain;
