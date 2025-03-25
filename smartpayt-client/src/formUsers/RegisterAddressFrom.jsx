import liff from '@line/liff'; // Import the LIFF SDK
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css';

const RegisterAddressForm = () => {
  const [formData, setFormData] = useState({
    lineUserId: localStorage.getItem("lineUserId") || "", // ✅ ดึง lineUserId จาก localStorage
    house_no: "",
    address_detail: "",
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // ✅ Initialize LIFF and get the Line User ID
  const initLiff = async () => {
    try {
      const storedToken = localStorage.getItem("token");  // ตรวจสอบว่า token มีอยู่หรือไม่

      // ถ้ามี token อยู่แล้ว ไม่ต้องล็อกอินใหม่
      if (storedToken) {
        console.log("Token found in localStorage.");
        const savedLineUserId = localStorage.getItem("lineUserId");
        if (savedLineUserId) {
          setFormData((prevData) => ({
            ...prevData,
            lineUserId: savedLineUserId,
          }));
        }
        return; // ไม่ต้องทำการเริ่มต้น LIFF ใหม่
      }

      // ถ้าไม่มี token, ให้เริ่มต้น LIFF และตรวจสอบการเข้าสู่ระบบ
      console.log("Initializing LIFF...");
      await liff.init({ liffId: "2006592847-7XwNn0YG" });
      console.log("LIFF initialized successfully");

      // ตรวจสอบการเข้าสู่ระบบของผู้ใช้
      if (!liff.isLoggedIn()) {
        console.log("User not logged in. Redirecting...");
        liff.login();
        return;
      }

      // ตรวจสอบ ID Token
      let idToken = localStorage.getItem("line_idToken") || liff.getIDToken();
      if (!idToken) {
        console.log("No valid ID Token found. Logging in again...");
        localStorage.removeItem("line_idToken");
        liff.logout();
        liff.login();
        return;
      }

      // ตรวจสอบว่า ID Token หมดอายุหรือไม่
      const tokenPayload = JSON.parse(atob(idToken.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      if (tokenPayload.exp < currentTime) {
        console.log("ID Token expired. Logging in again...");
        localStorage.removeItem("line_idToken");
        liff.logout();
        liff.login();
        return;
      }

      // ขอข้อมูลโปรไฟล์จาก LIFF
      let profile;
      try {
        profile = await liff.getProfile();
        console.log("Profile fetched:", profile);
      } catch (profileError) {
        console.error("Failed to fetch profile:", profileError);
        return;
      }

      setFormData((prevData) => ({
        ...prevData,
        lineUserId: profile.userId,
      }));

      const res = await axios.post("http://localhost:3000/auth/line-login", { idToken });
      console.log("Server Response:", res.data);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("lineUserId", res.data.user.id);
      localStorage.setItem("lineUserName", res.data.user.name);

      console.log("User authenticated successfully!");
    } catch (error) {
      console.error("LIFF Initialization failed:", error);
    }
  };

  useEffect(() => {
    initLiff();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!formData.house_no || !formData.address_detail) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/api/registerAddress', formData);
      console.log(response.data); // Log the response or use it in some way
      setMessage('ลงทะเบียนสำเร็จ!');
      setTimeout(() => {
        navigate('/UserDashboard');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      console.error('Registration error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-6 border rounded-xl shadow-md bg-white">
      {[
        { label: "บ้านเลขที่", name: "house_no", required: true },
        { label: "รายละเอียดที่อยู่", name: "address_detail", required: true }, 
      ].map(({ label, name, required, type, maxLength }) => (
        <div key={name} className="mb-4">
          <label className="block text-gray-700">{label}</label>
          <input
            type={type || "text"}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-green-200"
            required={required}
            maxLength={maxLength}
            inputMode={type === "number" ? "numeric" : undefined}
            onInput={type === "number" ? (e) => e.target.value = e.target.value.replace(/\D/g, '') : undefined}
          />
        </div>
      ))}

      <button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-full transition-all">
        ลงทะเบียนที่อยู่
      </button>

      {error && <p className="text-red-500 mt-3 text-center">{error}</p>}
      {message && <p className="text-green-500 mt-3 text-center">{message}</p>}
    </form>
  );
};
export default RegisterAddressForm;
