import { useState } from "react";
import { useNavigate } from "react-router-dom";
import nanglaeIcon from "../assets/img/nanglaeicon.png";

const AdminLogin = () => {
  const [admin_username, setUsername] = useState("");
  const [admin_password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); 
  const [error, setError] = useState(""); 
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); 
  
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_username, admin_password }),
      });
  
      const data = await response.json(); 
  
      if (response.ok) {
        // 1. บันทึก Token (Key: Admin_token)
        localStorage.setItem("Admin_token", data.Admintoken);
        
        // 2. บันทึก Role (Key: user_role) <--- ✅ ส่วนที่ถูกเพิ่ม/แก้ไข
        if (data.role) {
            localStorage.setItem("user_role", data.role);
        } else {
             // ⚠️ หาก Back-end ไม่ได้ส่ง role มา (ควรแก้ไข Back-end ให้ส่งมา)
             console.warn("Backend did not return a role. Defaulting to 'collector'.");
             localStorage.setItem("user_role", 'collector');
        }

        // 3. นำทางไปหน้า Admin
        navigate("/admin");
      } else {
        setError(data.message || "เข้าสู่ระบบล้มเหลว");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองอีกครั้ง");
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <img src={nanglaeIcon} alt="Nang Lae Icon" className="w-40 h-40 mx-auto mb-4" />
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Admin Login</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
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
                type={showPassword ? "text" : "password"} 
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
                {showPassword ? "👁️" : "🙈"} 
              </button>
            </div>
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Login
          </button>
        </form>
        <div className="mt-4 text-center">
          <button 
            onClick={() => navigate("/adminregister")}
            className="text-blue-600 hover:underline"
          >
            Go to Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;