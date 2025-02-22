import axios from "axios";

const AdminLogin = async (admin_username, admin_password) => {
  try {
    const res = await axios.post("http://localhost:3000/adminlogin", {
      admin_username,
      admin_password,
    });

    if (res.data.token) {
      localStorage.setItem("adminToken", res.data.token); // ✅ เก็บ token
      return { success: true, token: res.data.token };
    }
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "เกิดข้อผิดพลาด" };
  }
};

export default AdminLogin;
