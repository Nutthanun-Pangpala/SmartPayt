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
  const [isBillDropdownOpen, setIsBillDropdownOpen] = useState(false);
  const [isVerifyDropdownOpen, setIsVerifyDropdownOpen] = useState(false);
  const [isWasteDropdownOpen, setIsWasteDropdownOpen] = useState(false);

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

  const formatMonthLabel = (monthStr) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(year, Number(month) - 1);
    return date.toLocaleString("th-TH", { year: "numeric", month: "short" });
  };

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
          setSelectedMonth(response.data[0]);
        }
      } catch (error) {
        console.error("Error fetching available months:", error);
      }
    };

    fetchAvailableMonths();
  }, [navigate]);

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
    <div className="flex flex-col min-h-screen bg-[#FDEFB2]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white shadow">
        <div className="flex items-center space-x-3">
          <button onClick={toggleSidebar} className="text-gray-800 p-2">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <img src={nanglaeIcon} alt="icon" className="h-20" />
          <h2 className="text-2xl font-bold text-gray-800">เทศบาลตำบลนางแล</h2>
        </div>
      </div>

      <div className="flex h-[calc(100vh-88px)]">
        {/* Sidebar */}
        <div className={`relative ${isSidebarOpen ? "w-1/5" : "w-0"} bg-[#7A9442] text-white p-5 transition-all overflow-hidden`}>
          <h2 className="text-xl font-bold mb-4">Smart Payt</h2>
          <ul>
            <li className="mb-2 bg-[#F7D488] 	text-[#6B5E4E] font-semibold p-3 rounded shadow-md">
              หน้าหลัก
            </li>


            <li className="mb-2 hover:bg-[#8A9A5B] p-3 rounded cursor-pointer" onClick={() => navigate("/admin/service")}>
              ข้อมูลผู้ใช้บริการ
            </li>

            {/* ตรวจสอบบิลชำระ */}
            <li className="mb-2 hover:bg-[#8A9A5B] p-3 rounded cursor-pointer" onClick={() => setIsBillDropdownOpen(!isBillDropdownOpen)}>
              <div className="flex justify-between items-center">
                <span>ตรวจสอบบิลชำระ</span>
                <span className={`transform transition-transform ${isBillDropdownOpen ? "rotate-90" : ""}`}>▶</span>
              </div>
            </li>
            {isBillDropdownOpen && (
              <ul className="ml-4">
                <li className="p-2 hover:bg-[#8A9A5B] rounded cursor-pointer" onClick={() => navigate("/admin/debt")}>ข้อมูลผู้ค้างชำระ</li>
                <li className="p-2 hover:bg-[#8A9A5B] rounded cursor-pointer" onClick={() => navigate("/admin/payment-slips")}>ตรวจสอบสลิป</li>
              </ul>
            )}

            {/* ยืนยันสถานะผู้ใช้บริการ */}
            <li className="mb-2 hover:bg-[#8A9A5B] p-3 rounded cursor-pointer" onClick={() => setIsVerifyDropdownOpen(!isVerifyDropdownOpen)}>
              <div className="flex justify-between items-center">
                <span>ยืนยันสถานะผู้ใช้บริการ</span>
                <span className={`transform transition-transform ${isVerifyDropdownOpen ? "rotate-90" : ""}`}>▶</span>
              </div>
            </li>
            {isVerifyDropdownOpen && (
              <ul className="ml-4">
                <li className="p-2 hover:bg-[#8A9A5B] rounded cursor-pointer" onClick={() => navigate("/admin/verified-user")}>ยืนยันผู้ใช้</li>
                <li className="p-2 hover:bg-[#8A9A5B] rounded cursor-pointer" onClick={() => navigate("/admin/verified-address")}>ยืนยันครัวเรือน</li>
              </ul>
            )}

            {/* การจัดการบิลและขยะ */}
            <li className="mb-2 hover:bg-[#8A9A5B] p-3 rounded cursor-pointer" onClick={() => setIsWasteDropdownOpen(!isWasteDropdownOpen)}>
              <div className="flex justify-between items-center">
                <span>การจัดการบิลและขยะ</span>
                <span className={`transform transition-transform ${isWasteDropdownOpen ? "rotate-90" : ""}`}>▶</span>
              </div>
            </li>
            {isWasteDropdownOpen && (
              <ul className="ml-4">
                <li className="p-2 hover:bg-[#8A9A5B] rounded cursor-pointer" onClick={() => navigate("/admin/bills")}>สร้างใบแจ้งหนี้</li>
                <li className="p-2 hover:bg-[#8A9A5B] rounded cursor-pointer" onClick={() => navigate("/admin/editwaste")}>กำหนดราคาขยะ</li>
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

        {/* Content */}
        <div className="flex-1 p-5 overflow-auto">
          <h1 className="text-3xl font-bold mb-6">ข้อมูลภาพรวม</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* สถิติผู้ใช้ */}
            <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
              {[
                { label: "จำนวนผู้ใช้ลงทะเบียน", value: stats.totalUsers, color: "text-blue-600", info: "จำนวนผู้ใช้ที่ลงทะเบียน" },
                { label: "จำนวนครัวเรือนที่ลงทะเบียน", value: stats.totalAddress, color: "text-blue-600", info: "จำนวนครัวเรือนที่ลงทะเบียน" },
                { label: "จำนวนผู้ใช้รอยืนยันตัวตน", value: stats.pendingUsers, color: "text-yellow-600", info: "ผู้ใช้ที่รอการยืนยันตัวตน" },
                { label: "จำนวนครัวเรือนรอยืนยันตัวตน", value: stats.pendingAddresses, color: "text-yellow-600", info: "ครัวเรือนที่รอการยืนยัน" },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">{item.label}</h2>
                    <FaInfoCircle title={item.info} className={`${item.color} cursor-pointer`} />
                  </div>
                  <p className={`text-4xl font-bold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* กราฟ + ทิ้งขยะสะสม */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">เลือกเดือน</h2>
                <div className="grid grid-cols-4 gap-2">
                  {availableMonths.length === 0 && (
                    <p className="text-gray-500">ไม่มีข้อมูลเดือนใดให้แสดง</p>
                  )}
                  {availableMonths.map((month) => (
                    <button
                      key={month}
                      onClick={() => setSelectedMonth(month)}
                      className={`px-3 py-2 rounded border text-center ${selectedMonth === month
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                    >
                      {formatMonthLabel(month)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">สัดส่วนปริมาณขยะ</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={wasteData} dataKey="value" outerRadius={80} labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} cx="50%" cy="50%">
                        {wasteData.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">จำนวนการทิ้งขยะสะสม</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { name: "ขยะทั่วไป", value: stats.generalWaste, color: "text-blue-500" },
                    { name: "ขยะอันตราย", value: stats.hazardousWaste, color: "text-orange-500" },
                    { name: "ขยะรีไซเคิล", value: stats.recycleWaste, color: "text-green-500" },
                  ].map((item, index) => (
                    <div className="bg-white p-4 rounded-lg shadow-md" key={index}>
                      <h3 className="text-lg font-semibold">{item.name}</h3>
                      <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
                      <p className="text-gray-500">จำนวนการทิ้ง</p>
                    </div>
                  ))}
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