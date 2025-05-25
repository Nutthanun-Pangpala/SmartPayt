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

  useEffect(() => {
    const initLiff = async () => {
      try {
        if (localStorage.getItem("token") || localStorage.getItem("lineUserId")) {
          // navigate('/');
          return;
        }
        await liff.init({ liffId: "2006592847-7XwNn0YG" });
        if (!liff.isLoggedIn()) liff.login();
        const profile = await liff.getProfile();
        setFormData(prev => ({ ...prev, lineUserId: profile.userId }));
        const res = await axios.post("http://localhost:3000/auth/line-login", { idToken: liff.getIDToken() });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("lineUserId", res.data.user.id);
      } catch (err) {
        console.error("LIFF Initialization failed:", err);
      }
    };
    initLiff();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
  
    if (name === "ID_card_No") {
      newValue = value.replace(/\D/g, '').slice(0, 13); // รับเฉพาะตัวเลข และจำกัด 13 ตัว
    } else if (name === "Phone_No") {
      newValue = value.replace(/\D/g, '').slice(0, 10); // รับเฉพาะตัวเลข และจำกัด 10 ตัว
    }
  
    setFormData({ ...formData, [name]: newValue });
  };
  
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!formData.lineUserId || !formData.ID_card_No || !formData.Phone_No || !formData.Email || !formData.name) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    try {
      const res = await axios.post('http://localhost:3000/api/registerAccount', formData);
      localStorage.setItem('token', res.data.token);
      setMessage('ลงทะเบียนสำเร็จ!');
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  return (
    <div>
      <ToastNotification message={message} error={error} />
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 border rounded-xl">
        {['ID_card_No', 'name', 'Phone_No', 'Email'].map(field => (
          <div key={field} className="m-6">
            <label className="block text-gray-700 mb-2">{field}</label>
            <input
              type={field === 'Email' ? 'email' : 'text'}
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
