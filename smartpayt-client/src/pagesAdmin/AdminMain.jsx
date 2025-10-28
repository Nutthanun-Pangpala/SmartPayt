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
import AdminLayout from '../pagesAdmin/component/AdminLayout'; // 1. Import AdminLayout

// 2. Import ไอคอนมาเพิ่ม
import {
  FaBiohazard,
  FaClock,
  FaHome,
  FaLeaf,
  FaRecycle,
  FaTrash,
  FaUsers
} from "react-icons/fa";

// 3. สร้าง Component การ์ดสถิติที่ใช้ซ้ำได้
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
  // ... (State ทั้งหมดของคุณเหมือนเดิม) ...
  const [stats, setStats] = useState({ /* ... */ });
  const [wasteData, setWasteData] = useState([ /* ... */ ]);
  const [pendingUsers, setPendingUsers] = useState(0);
  const [pendingAddresses, setPendingAddresses] = useState(0);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");

  const navigate = useNavigate();

  // 4. (ปรับปรุง) อัปเดตสี Pie Chart ให้ตรงกับธีมใหม่
  // ["ขยะทั่วไป (ฟ้า)", "ขยะอันตราย (แดง)", "ขยะรีไซเคิล (เขียว)", "ขยะอินทรีย์ (น้ำตาล)"]
  const COLORS = ["#3B82F6", "#EF4444", "#22C55E", "#854D0E"];

  // ... (Functions และ useEffects ทั้งหมดของคุณเหมือนเดิม) ...
  const fetchPendingCounts = async () => { /* ... */ };
  useEffect(() => { fetchPendingCounts(); }, []);
  const formatMonthLabel = (monthStr) => { /* ... */ };
  useEffect(() => { /* ... fetchAvailableMonths ... */ }, [navigate]);
  useEffect(() => { /* ... fetchWasteByMonth ... */ }, [selectedMonth, navigate]);
  useEffect(() => { /* ... fetchStats ... */ }, [navigate]);


  // 5. (ปรับปรุง) นี่คือ JSX ที่ออกแบบใหม่ทั้งหมด
  return (
    <AdminLayout>
      <div className="space-y-8"> {/* ใช้ space-y-8 เพื่อจัดระยะห่างระหว่างแถว */}
        
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
              onClick={() => navigate('/admin/verified-user')} // <-- ทำให้คลิกได้
            />
            <StatCard 
              icon={<FaClock />}
              label="ครัวเรือนรอยืนยัน"
              value={pendingAddresses}
              iconBgColor="bg-yellow-100"
              iconTextColor="text-yellow-600"
              onClick={() => navigate('/admin/verified-address')} // <-- ทำให้คลิกได้
            />
            <StatCard 
              icon={<FaUsers />}
              label="ผู้ใช้ทั้งหมด"
              value={stats.totalUsers}
              iconBgColor="bg-green-100"
              iconTextColor="text-green-600"
            />
            <StatCard 
              icon={<FaHome />}
              label="ครัวเรือนทั้งหมด"
              value={stats.totalAddress}
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
                {availableMonths.length === 0 ? (
                  <p className="text-gray-500">ไม่มีข้อมูลเดือน</p>
                ) : (
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
                )}
              </div>
            </div>

            {/* ส่วน Pie Chart */}
            <div className="lg:col-span-2 h-80">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">สัดส่วนปริมาณขยะ (รายเดือน)</h2>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={wasteData.filter(d => d.value > 0)} // กรองข้อมูลที่เป็น 0 ออก
                    dataKey="value" 
                    nameKey="name"
                    cx="50%" 
                    cy="50%" 
                    outerRadius={100} 
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {wasteData.map((entry, index) => (
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
              value={stats.generalWaste}
              iconBgColor="bg-blue-100"
              iconTextColor="text-blue-600"
            />
            <StatCard 
              icon={<FaBiohazard />}
              label="ขยะอันตราย"
              value={stats.hazardousWaste}
              iconBgColor="bg-red-100"
              iconTextColor="text-red-600"
            />
            <StatCard 
              icon={<FaRecycle />}
              label="ขยะรีไซเคิล"
              value={stats.recycleWaste}
              iconBgColor="bg-green-100"
              iconTextColor="text-green-600"
            />
            <StatCard 
              icon={<FaLeaf />}
              label="ขยะอินทรีย์"
              value={stats.organicWaste}
              iconBgColor="bg-yellow-800" // (Tailwind 'brown' ไม่มี, 'yellow-800' ใกล้เคียง)
              iconTextColor="text-yellow-100"
            />
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminMain;