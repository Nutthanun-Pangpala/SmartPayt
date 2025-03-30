import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ToastNotification from '../assets/component/user/ToastNotification';

const AddUser = () => {
  // ดึง lineUserId จาก URL ด้วย useParams
  const { lineUserId } = useParams();

  const [formData, setFormData] = useState({
    lineUserId: lineUserId || "",
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
      // ส่งข้อมูลที่อยู่ไปยัง server โดยใช้ lineUserId จาก URL
      const response = await axios.post(`http://localhost:3000/admin/users/${lineUserId}/add-address`, formData);
      
      if (response.data.success) {
        setMessage('ลงทะเบียนที่อยู่สำเร็จ!');
        setTimeout(() => navigate(`/admin/user/${lineUserId}`), 2000); // ใช้ backticks (``) ที่นี่
      } else {
        setError('เกิดข้อผิดพลาดในการลงทะเบียนที่อยู่');
      }
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

export default AddUser;
