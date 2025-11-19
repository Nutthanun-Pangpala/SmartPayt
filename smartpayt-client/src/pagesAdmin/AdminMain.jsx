import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import AdminLayout from '../pagesAdmin/component/AdminLayout';
import api from '../api';
import {
  FaBiohazard,
  FaClock,
  FaHome,
  FaLeaf,
  FaRecycle,
  FaTrash,
  FaUsers
} from "react-icons/fa";

const StatCard = ({ icon, label, value, iconBgColor, iconTextColor, onClick }) => (
  <div 
    className={`bg-white p-5 rounded-lg shadow-md flex items-center space-x-4 ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200' : ''}`}
    onClick={onClick}
  >
    <div className={`text-3xl p-4 rounded-full ${iconBgColor} ${iconTextColor}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-600 font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const AdminMain = () => {
  const [stats, setStats] = useState({});
  const [wasteData, setWasteData] = useState([]);
  const [pendingUsers, setPendingUsers] = useState(0);
  const [pendingAddresses, setPendingAddresses] = useState(0);
  
  // ✅ กำหนดค่าเริ่มต้นเป็น Array ว่างเสมอ
  const [availableMonths, setAvailableMonths] = useState([]); 
  const [selectedMonth, setSelectedMonth] = useState("");
  
  const navigate = useNavigate();
  const COLORS = ["#3B82F6", "#EF4444", "#22C55E", "#854D0E"];

  const formatMonthLabel = (monthStr) => {
    if (!monthStr) return "";
    const [year, month] = monthStr.split("-");
    const date = new Date(year, Number(month) - 1);
    return date.toLocaleString("th-TH", { year: "numeric", month: "short" });
  };

  // Fetch Available Months
  useEffect(() => {
    const fetchAvailableMonths = async () => {
      try {
        const response = await api.get("/admin/waste-months");
        
        // ✅ แก้ไข 1: ตรวจสอบว่า data เป็น Array จริงหรือไม่ก่อน set state
        if (Array.isArray(response.data)) {
            setAvailableMonths(response.data);
            if (response.data.length > 0) {
                setSelectedMonth(response.data[0]);
            }
        } else {
            console.warn("API Response format error (waste-months): Expected array but got", response.data);
            setAvailableMonths([]); // กันเหนียว set เป็น array ว่าง
        }

      } catch (error) {
        console.error("Error fetching available months:", error);
        if (error.response?.status === 401) navigate("/adminlogin");
        setAvailableMonths([]); // ถ้า error ก็ set ว่างไว้
      }
    };
    fetchAvailableMonths();
  }, [navigate]);

  // Fetch Waste Data by Month
  useEffect(() => {
    if (!selectedMonth) return;

    const fetchWasteByMonth = async (month) => {
      try {
        const response = await api.get(`/admin/waste-stats?month=${month}`);
        // ตรวจสอบว่าเป็น Array ก่อน set
        if (Array.isArray(response.data)) {
           setWasteData(response.data);
        } else {
           setWasteData([]);
        }
      } catch (error) {
        console.error("Error fetching waste by month:", error);
        if (error.response?.status === 401) navigate("/adminlogin");
      }
    };
    fetchWasteByMonth(selectedMonth);
  }, [selectedMonth, navigate]);

  // Fetch General Stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, pendingRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/pending-counts"), 
        ]);

        setStats(statsRes.data || {});
        setPendingUsers(pendingRes.data?.pendingUsers ?? 0);
        setPendingAddresses(pendingRes.data?.pendingAddresses ?? 0);

      } catch (error) {
        console.error("Error fetching stats:", error);
        if (error.response?.status === 401) {
          navigate("/adminlogin");
        }
      }
    };
    fetchStats();
  }, [navigate]);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* แถวที่ 1: ข้อมูลสำคัญ (Actionable) */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">รายการที่ต้องดำเนินการ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              icon={<FaClock />}
              label="ผู้ใช้รอยืนยัน"
              value={pendingUsers}
              iconBgColor="bg-yellow-100"
              iconTextColor="text-yellow-600"
              onClick={() => navigate('/admin/verified-user')}
            />
            <StatCard 
              icon={<FaClock />}
              label="ครัวเรือนรอยืนยัน"
              value={pendingAddresses}
              iconBgColor="bg-yellow-100"
              iconTextColor="text-yellow-600"
              onClick={() => navigate('/admin/verified-address')}
            />
            <StatCard 
              icon={<FaUsers />}
              label="ผู้ใช้ทั้งหมด"
              value={stats.totalUsers || 0}
              iconBgColor="bg-green-100"
              iconTextColor="text-green-600"
            />
            <StatCard 
              icon={<FaHome />}
              label="ครัวเรือนทั้งหมด"
              value={stats.totalAddress || 0}
              iconBgColor="bg-green-100"
              iconTextColor="text-green-600"
            />
          </div>
        </div>

        {/* แถวที่ 2: สถิติขยะรายเดือน (Monthly Stats) */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ส่วนเลือกเดือน */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">เลือกเดือน</h2>
              <div className="flex flex-col space-y-2">
                {/* ✅ แก้ไข 2: ตรวจสอบ Array.isArray ในการแสดงผล */}
                {Array.isArray(availableMonths) && availableMonths.length > 0 ? (
                  availableMonths.map((month) => (
                    <button
                      key={month}
                      onClick={() => setSelectedMonth(month)}
                      className={`px-4 py-2 rounded-lg text-left font-medium transition-colors ${
                        selectedMonth === month
                          ? "bg-green-600 text-white shadow"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {formatMonthLabel(month)}
                    </button>
                  ))
                ) : (
                  <p className="text-gray-500">ไม่มีข้อมูลเดือน</p>
                )}
              </div>
            </div>

            {/* ส่วน Pie Chart */}
            <div className="lg:col-span-2 h-80">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">สัดส่วนปริมาณขยะ (รายเดือน)</h2>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={Array.isArray(wasteData) ? wasteData.filter(d => d.value > 0) : []} 
                    dataKey="value" 
                    nameKey="name"
                    cx="50%" 
                    cy="50%" 
                    outerRadius={100} 
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {Array.isArray(wasteData) && wasteData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* แถวที่ 3: ข้อมูลขยะสะสม (All-Time) */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">จำนวนการทิ้งขยะสะสม (ทั้งหมด)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              icon={<FaTrash />}
              label="ขยะทั่วไป"
              value={stats.generalWaste || 0}
              iconBgColor="bg-blue-100"
              iconTextColor="text-blue-600"
            />
            <StatCard 
              icon={<FaBiohazard />}
              label="ขยะอันตราย"
              value={stats.hazardousWaste || 0}
              iconBgColor="bg-red-100"
              iconTextColor="text-red-600"
            />
            <StatCard 
              icon={<FaRecycle />}
              label="ขยะรีไซเคิล"
              value={stats.recycleWaste || 0}
              iconBgColor="bg-green-100"
              iconTextColor="text-green-600"
            />
            <StatCard 
              icon={<FaLeaf />}
              label="ขยะอินทรีย์"
              value={stats.organicWaste || 0}
              iconBgColor="bg-yellow-800"
              iconTextColor="text-yellow-100"
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMain;