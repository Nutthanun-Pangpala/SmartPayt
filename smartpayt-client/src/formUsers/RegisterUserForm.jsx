import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ToastNotification from "../assets/component/user/ToastNotification";

// (ลบ) Logo และ FontImporter ออกจากไฟล์นี้

// (ไอคอนยังต้องใช้)
import { FaHome, FaUser, FaPhone, FaEnvelope, FaSpinner } from "react-icons/fa";

// (Component InputWithIcon ยังต้องใช้)
const InputWithIcon = ({ icon, label, name, value, onChange, placeholder, type = "text", required = false }) => (
  <div className="mb-4">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative rounded-lg shadow-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        {icon}
      </div>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        placeholder={placeholder}
        required={required}
      />
    </div>
  </div>
);

const RegisterUserForm = () => {
  // ... (State และ Logic ทั้งหมดเหมือนเดิม) ...
  const [formData, setFormData] = useState({
    lineUserId: "",
    name: "",
    house_id: "",
    Phone_No: "",
    Email: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserId = async () => {
      const lineUserId = localStorage.getItem("lineUserId");
      if (!lineUserId) { navigate("/userLogin"); return; }
      setFormData((prev) => ({ ...prev, lineUserId: lineUserId }));
      try {
        const checkUser = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/checkUser/${lineUserId}`);
        if (checkUser.data.exists) { navigate("/"); }
      } catch (err) { console.error("Error checking user:", err); }
    };
    checkUserId();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!formData.lineUserId || !formData.house_id || !formData.Phone_No || !formData.Email || !formData.name) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/registerAccount`, formData);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("lineUserId", formData.lineUserId);
      setMessage("ลงทะเบียนสำเร็จ!");
      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      setError(err.response?.data?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // (แก้ไข) JSX ถูกปรับปรุง
  return (
    // (ลบ) Layout (พื้นเทา, min-h-screen) ออก
    <>
      {/* (ปรับปรุง) Toast ลอยมุมบนขวา */}
      <div className="fixed top-4 right-4 z-50">
        <ToastNotification message={message} error={error} />
      </div>

      {/* (ปรับปรุง) เริ่มที่การ์ดฟอร์มสีขาวได้เลย */}
      <div className="w-full max-w-md bg-white p-6 md:p-8 rounded-lg shadow-xl">
        
        {/* (ลบ) โลโก้ และ Title ออกจากไฟล์นี้ */}
        
        <form onSubmit={handleSubmit}>
          <InputWithIcon
            icon={<FaHome className="text-gray-400" />}
            label="รหัสครัวเรือน"
            name="house_id"
            value={formData.house_id}
            onChange={handleChange}
            placeholder="กรอกรหัสครัวเรือน 11 หลัก"
            required
          />
          <InputWithIcon
            icon={<FaUser className="text-gray-400" />}
            label="ชื่อ-นามสกุล"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="กรอกชื่อ-นามสกุล (ที่แสดงในแอป)"
            required
          />
          <InputWithIcon
            icon={<FaPhone className="text-gray-400" />}
            label="เบอร์โทรศัพท์"
            name="Phone_No"
            value={formData.Phone_No}
            onChange={handleChange}
            placeholder="081-234-5678"
            type="tel"
            required
          />
          <InputWithIcon
            icon={<FaEnvelope className="text-gray-400" />}
            label="อีเมล"
            name="Email"
            value={formData.Email}
            onChange={handleChange}
            placeholder="example@mail.com"
            type="email"
            required
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full text-white py-2.5 rounded-lg transition-all text-base font-medium mt-4 ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg'
            }`}
          >
            {isSubmitting ? (
              <FaSpinner className="animate-spin inline-block mr-2" />
            ) : null}
            {isSubmitting ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
          </button>
        </form>
      </div>
    </>
  );
};

export default RegisterUserForm;