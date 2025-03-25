import liff from '@line/liff';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToastNotification from '../assets/component/user/ToastNotification';
import '../index.css';

const RegisterUserForm = () => {
  const [formData, setFormData] = useState({
    lineUserId: localStorage.getItem("lineUserId") || "", 
    name: '',
    ID_card_No: '',
    Phone_No: '',
    Email: '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // ปรับปรุงฟังก์ชัน LIFF
  const initLiff = async () => {
    try {
      const storedToken = localStorage.getItem("token");  // ตรวจสอบว่า token มีอยู่หรือไม่

      // ถ้ามี token อยู่แล้ว ไม่ต้องล็อกอินใหม่
      if (storedToken) {
        console.log("Token found in localStorage.");
        navigate('/')
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
    
    if (!formData.lineUserId) {
      setError("ไม่พบ Line User ID กรุณาเข้าสู่ระบบใหม่");
      return;
    }
  
    if (!formData.ID_card_No || !formData.Phone_No || !formData.Email || !formData.name) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
  
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.Email)) {
      setError('กรุณากรอกอีเมลให้ถูกต้อง');
      return;
    }
  
    if (formData.Phone_No.length !== 10) {
      setError('กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก');
      return;
    }
  
    try {
      const response = await axios.post('http://localhost:3000/api/registerAccount', formData);
      const { token } = response.data;
      localStorage.setItem('token', token);
  
      setMessage('ลงทะเบียนสำเร็จ!');
      setTimeout(() => navigate('/'), 1000); // นำทางหลังจากลงทะเบียนสำเร็จ
    } catch (error) {
      if (error.response) {
        setError(error.response.data.message || 'เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่');
      } else {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      }
      console.error('Registration error:', error);
    }
  };

  return (
    <div>
      <ToastNotification  message={message}  />
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 drop-shadow-sm border rounded-xl">
      <div className="m-6">
        <label className="block text-gray-700 mb-2">บัตรประจำตัวประชาชน / ID Card Number</label>
        <input
          type="text"
          name="ID_card_No"
          value={formData.ID_card_No}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-2xl"
          placeholder="เลขบัตรประจำตัวประชาชน..."
          maxLength="13"
          inputMode="numeric"
          onInput={(e) => e.target.value = e.target.value.replace(/\D/g, '')}
          required
        />
      </div>
      <div className="m-6">
        <label className="block text-gray-700 mb-2">ชื่อ-นามสกุล / Full Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-2xl"
          placeholder="ชื่อ-นามสกุล..."
          required
        />
      </div>

      <div className="m-6">
        <label className="block text-gray-700 mb-2">เบอร์โทรศัพท์ / Phone Number</label>
        <input
          type="text"
          name="Phone_No"
          value={formData.Phone_No}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-2xl"
          placeholder="กรอกเบอร์โทรศัพท์..."
          maxLength="10"
          inputMode="numeric"
          onInput={(e) => e.target.value = e.target.value.replace(/\D/g, '')}
          required
        />
      </div>

      <div className="m-6">
        <label className="block text-gray-700 mb-2">Email</label>
        
        <input
          type="email"
          name="Email"
          value={formData.Email}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-2xl"
          placeholder="Email..."
          required
        />
      </div>

      <button type="submit" className="w-full my-5 bg-green-700 text-white py-2 rounded-full">
        ลงทะเบียน
      </button>
      {error && <p className="text-red-500 mb-4">{error}</p>}
    </form>
    </div>
  );
};

export default RegisterUserForm;
