import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToastNotification from '../assets/component/user/ToastNotification';
import '../index.css';
const provinceData = {
  "เชียงราย": {
    "เมืองเชียงราย": ["เวียง", "รอบเวียง", "บ้านดู่", "นางแล"],
    "แม่สาย": ["เวียงพางคำ", "โป่งผา", "ศรีเมืองชุม"],
    "เชียงแสน": ["เวียง", "ศรีดอนมูล", "บ้านแซว"],
    "เทิง": ["เวียง", "งิ้ว", "ปล้อง"],
    "พาน": ["เมืองพาน", "สันมะเค็ด", "เจริญเมือง"]
  }
};

const RegisterAddressForm = () => {
  const [formData, setFormData] = useState({
    lineUserId: localStorage.getItem("lineUserId") || "",
    house_no: "",
    alley: "",
    province: "เชียงราย",
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
        navigate("/userLogin");
        return;
      }

      setFormData((prev) => ({ ...prev, lineUserId: lineUserId }));

      try {
        const checkUser = await axios.get(`http://localhost:3000/api/checkUser/${lineUserId}`);
        if (checkUser.data.exists) {
          navigate("/");
        }
      } catch (err) {
        console.error("Error checking user:", err);
      }
    };

    checkUserId();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'district' ? { sub_district: '' } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const requiredFields = ["house_no", "district", "sub_district", "postal_code"];
    let errors = [];

    requiredFields.forEach((field) => {
      if (!formData[field]) {
        errors.push(`กรุณากรอก ${field}`);
      }
    });

    if (!/^[\w\s\/-]+$/.test(formData.house_no)) {
      errors.push("บ้านเลขที่ต้องเป็นตัวเลขหรือตัวอักษรเท่านั้น");
    }

    if (!/^\d{5}$/.test(formData.postal_code)) {
      errors.push("รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก");
    }
    if (!formData.sub_district) {
      errors.push("กรุณาเลือกตำบล");
    }

    if (errors.length > 0) {
      setError(errors.join("\n"));
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/api/registerAddress', formData);
      setMessage(response.data.message || 'ลงทะเบียนสำเร็จ!');      
      setTimeout(() => navigate('/UserDashboard'), 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ToastNotification message={message} error={error} />
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-6 border rounded-xl shadow-md bg-white">

        {/* บ้านเลขที่ & ตรอก */}
        {[
          { label: "บ้านเลขที่", name: "house_no", required: true },
          { label: "ถนน / ซอย", name: "alley", required: false }
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

        {/* จังหวัด (ล็อกค่าเชียงราย) */}
        <div className="mb-4">
          <label className="block text-gray-700">จังหวัด</label>
          <select className="w-full px-3 py-2 border rounded-lg bg-gray-100" disabled>
            <option>เชียงราย</option>
          </select>
        </div>

        {/* อำเภอ */}
        <div className="mb-4">
          <label className="block text-gray-700">อำเภอ / เขต</label>
          <select
            name="district"
            value={formData.district}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-green-200"
            required
          >
            <option value="">-- กรุณาเลือกอำเภอ --</option>
            {Object.keys(provinceData["เชียงราย"]).map((district) => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </div>

        {/* ตำบล */}
        <div className="mb-4">
          <label className="block text-gray-700">ตำบล / แขวง</label>
          <select
            name="sub_district"
            value={formData.sub_district}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-green-200"
            required
            disabled={!formData.district}
          >
            <option value="">-- กรุณาเลือกตำบล --</option>
            {formData.district && provinceData["เชียงราย"][formData.district]?.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        {/* รหัสไปรษณีย์ */}
        <div className="mb-4">
          <label className="block text-gray-700">รหัสไปรษณีย์</label>
          <input
            type="text"
            name="postal_code"
            value={formData.postal_code}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-green-200"
            required
          />
        </div>

        {/* ปุ่มส่งฟอร์ม */}
        <button
          type="submit"
          className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-full transition-all"
          disabled={loading}
        >
          {loading ? "กำลังลงทะเบียน..." : "ลงทะเบียนที่อยู่"}
        </button>

      </form>
    </div>
  );
};

export default RegisterAddressForm;
