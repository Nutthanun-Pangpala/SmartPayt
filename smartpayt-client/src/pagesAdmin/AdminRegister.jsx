import { useState } from "react";
import { useNavigate } from "react-router-dom";
import nanglaeIcon from "../assets/img/nanglaeicon.png";

const AdminRegister = () => {
  const [admin_username, setUsername] = useState("");
  const [admin_password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // ✅ State สำหรับซ่อน/แสดงรหัสผ่าน
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_username, admin_password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("ลงทะเบียนเรียบร้อยแล้ว! กรุณาเข้าสู่ระบบ");
        navigate("/adminlogin");
      } else {
        alert(data.message || "ลงทะเบียนล้มเหลว");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <img src={nanglaeIcon} alt="Nang Lae Icon" className="w-40 h-40 mx-auto mb-4" />
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Admin Register</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-gray-700">Username</label>
            <input
              type="text"
              value={admin_username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} // ✅ เปลี่ยน type ตามค่า state
                value={admin_password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg pr-10"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600"
              >
                {showPassword ? "👁️" : "🙈"} {/* ✅ เปลี่ยนไอคอนตามสถานะ */}
              </button>
            </div>
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Register
          </button>
        </form>
        <div className="mt-4 text-center">
          <button 
            onClick={() => navigate("/adminlogin")}
            className="text-blue-600 hover:underline"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;