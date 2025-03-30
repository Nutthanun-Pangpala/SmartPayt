import liff from '@line/liff'; // Import LIFF SDK
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToastNotification from '../assets/component/user/ToastNotification';
import '../index.css';

const RegisterAddressForm = () => {
  const [formData, setFormData] = useState({
    lineUserId: localStorage.getItem("lineUserId") || "",
    house_no: "",
    alley: "",
    province: "",
    district: "",
    sub_district: "",
    postal_code: "",
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const initLiff = async () => {
      // เช็คว่า user ล็อกอินแล้วจาก localStorage หรือยัง
      const storedToken = localStorage.getItem("token");
      const savedLineUserId = localStorage.getItem("lineUserId");

      if (storedToken && savedLineUserId) {
        // หากมี token และ lineUserId ใน localStorage แล้วก็ไม่ต้องล็อกอินใหม่
        setFormData((prevData) => ({ ...prevData, lineUserId: savedLineUserId }));
        return;
      }

      // หากไม่มี token และ lineUserId ให้ทำการล็อกอินใหม่
      try {
        const liffId = "2006592847-7XwNn0YG"; // Your LIFF ID
        await liff.init({ liffId });

        if (!liff.isLoggedIn()) {
          return liff.login(); // หากยังไม่ได้ล็อกอิน ก็ให้ทำการล็อกอิน
        }

        // หลังจากล็อกอินแล้ว ดึงข้อมูลจากโปรไฟล์
        const profile = await liff.getProfile();
        setFormData((prev) => ({ ...prev, lineUserId: profile.userId }));

        // บันทึกข้อมูลลง localStorage
        localStorage.setItem("lineUserId", profile.userId);
        
        // ส่ง idToken ไปเซิร์ฟเวอร์เพื่อยืนยันตัวตน
        const idToken = liff.getIDToken();
        authenticateUser(idToken);
      } catch (error) {
        console.error("LIFF Initialization failed:", error);
      }
    };

    initLiff();
  }, []);

  // ฟังก์ชันตรวจสอบและยืนยันตัวตนผู้ใช้
  const authenticateUser = async (idToken) => {
    try {
      const res = await axios.post("http://localhost:3000/auth/line-login", { idToken });
      localStorage.setItem("token", res.data.token); // บันทึก token
      localStorage.setItem("lineUserId", res.data.user.id); // บันทึก lineUserId
      localStorage.setItem("lineUserName", res.data.user.name); // บันทึกชื่อผู้ใช้
    } catch (error) {
      console.error("Server authentication failed:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // ตรวจสอบว่ากรอกข้อมูลครบถ้วน
    const requiredFields = ["house_no", "province", "district", "sub_district", "postal_code"];
    for (let field of requiredFields) {
      if (!formData[field]) {
        setError('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }
    }

    try {
      await axios.post('http://localhost:3000/api/registerAddress', formData);
      setMessage('ลงทะเบียนสำเร็จ!');
      setTimeout(() => navigate('/UserDashboard'), 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    }
  };

  return (
    <div>
      <ToastNotification message={message} error={error} />
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-6 border rounded-xl shadow-md bg-white">
        {[
          { label: "บ้านเลขที่", name: "house_no", required: true },
          { label: "ตรอก / ซอย", name: "alley", required: false },
          { label: "ตำบล / แขวง", name: "sub_district", required: true },
          { label: "อำเภอ / เขต", name: "district", required: true },
          { label: "จังหวัด", name: "province", required: true },
          { label: "รหัสไปรษณีย์", name: "postal_code", required: true },
        ].map(({ label, name, required }) => (
          <div key={name} className="mb-4">
            <label className="block text-gray-700">{label}</label>
            <input
              type="text"
              name={name}
              value={formData[name]}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-green-200"
              required={required}
            />
          </div>
        ))}
        <button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-full transition-all">
          ลงทะเบียนที่อยู่
        </button>
      </form>
    </div>
  );
};

export default RegisterAddressForm;
