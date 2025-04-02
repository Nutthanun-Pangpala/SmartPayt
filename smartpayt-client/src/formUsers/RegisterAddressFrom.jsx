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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkUserId = async () => {
      const lineUserId = localStorage.getItem("lineUserId");

      if (!lineUserId) {
        navigate("/userLogin"); // ถ้าไม่มี lineUserId ให้ไปหน้า Login
        return;
      }

      setFormData((prev) => ({ ...prev, lineUserId: lineUserId }));

      try {
        // เช็คว่า lineUserId มีในฐานข้อมูลหรือไม่
        const checkUser = await axios.get(`http://localhost:3000/api/checkUser/${lineUserId}`);
        if (checkUser.data.exists) {
          navigate("/"); // ถ้ามีบัญชีอยู่แล้วให้ไปหน้าแรก
        }
      } catch (err) {
        console.error("Error checking user:", err);
      }
    };

    checkUserId();
  }, [navigate]);

  // ฟังก์ชันตรวจสอบและยืนยันตัวตนผู้ใช

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };


const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setMessage('');
  setLoading(true); // เพิ่มสถานะการโหลด

  const requiredFields = ["house_no", "province", "district", "sub_district", "postal_code"];
  for (let field of requiredFields) {
    if (!formData[field]) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      setLoading(false); // หยุดโหลดหากกรอกข้อมูลไม่ครบ
      return;
    }
  }

  try {
    await axios.post('http://localhost:3000/api/registerAddress', formData);
    setMessage('ลงทะเบียนสำเร็จ!');
    setTimeout(() => navigate('/UserDashboard'), 2000);
  } catch (error) {
    setError(error.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
  } finally {
    setLoading(false); // หยุดโหลด
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
        <button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-full transition-all" disabled={loading}>
  {loading ? "กำลังลงทะเบียน..." : "ลงทะเบียนที่อยู่"}
</button>
      </form>
    </div>
  );
};

export default RegisterAddressForm;
