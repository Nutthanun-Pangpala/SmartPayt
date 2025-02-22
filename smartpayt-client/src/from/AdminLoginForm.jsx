import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLogin from "../pages/admin/Adminlogin";
import nanglaeIcon from "../assets/img/nanglaeicon.png"; // ✅ นำเข้ารูปภาพ

const AdminLoginForm = () => {
  const [admin_username, setUsername] = useState("");
  const [admin_password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const response = await AdminLogin(admin_username, admin_password);

    if (response.success) {
      navigate("/dashboard");
    } else {
      setError(response.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <img src={nanglaeIcon} alt="Nang Lae Icon" className="w-40 h-40 mx-auto mb-4" /> {/* ✅ แสดงไอคอน */}
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Admin Login</h2>
        {error && <p className="text-red-500">{error}</p>}
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
            <input
              type="password"
              value={admin_password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginForm;
