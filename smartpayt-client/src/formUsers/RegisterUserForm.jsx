import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ToastNotification from "../assets/component/user/ToastNotification";
import "../index.css";

const RegisterUserForm = () => {
  const [formData, setFormData] = useState({
    lineUserId: "",
    name: "",
    ID_card_No: "",
    Phone_No: "",
    Email: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!formData.lineUserId || !formData.ID_card_No || !formData.Phone_No || !formData.Email || !formData.name) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      // ลงทะเบียนบัญชีใหม่
      const res = await axios.post("http://localhost:3000/api/registerAccount", formData);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("lineUserId", formData.lineUserId);
      setMessage("ลงทะเบียนสำเร็จ!");
      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      setError(err.response?.data?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  return (
    <div>
      <ToastNotification message={message} error={error} />
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 border rounded-xl">
        {["ID_card_No", "name", "Phone_No", "Email"].map((field) => (
          <div key={field} className="m-6">
            <label className="block text-gray-700 mb-2">{field}</label>
            <input
              type={field === "Email" ? "email" : "text"}
              name={field}
              value={formData[field]}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-2xl"
              placeholder={field}
              required
            />
          </div>
        ))}
        <button type="submit" className="w-full my-5 bg-green-700 text-white py-2 rounded-full">
          ลงทะเบียน
        </button>
      </form>
    </div>
  );
};

export default RegisterUserForm;
