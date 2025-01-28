import liff from '@line/liff'; // Import the LIFF SDK
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import '../index.css';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    lineUserId: '',
    name: '',
    ID_card_No: '',
    Phone_No: '',
    Email: '',
    Home_ID: '',
    Address: '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Initialize LIFF and get the Line User ID
  const initLiff = async () => {
    try {
      // Initialize LIFF with your LIFF ID (replace with your own LIFF ID)
      await liff.init({ liffId: '2006592847-7XwNn0YG' });
      
      // Check if the user is logged in to LINE
      if (liff.isLoggedIn()) {
        const profile = await liff.getProfile();
        console.log(profile)
        setFormData((prevData) => ({
          ...prevData,
          lineUserId: profile.userId, // Get LINE user ID
          name: profile.displayName,  // Optionally get user's display name
        }));
      } else {
        // If not logged in, prompt to login
        liff.login();
      }
    } catch (error) {
      console.error('LIFF Initialization failed', error);
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

    // Validate the form data
    if (!formData.ID_card_No || !formData.Phone_No || !formData.Email || !formData.Home_ID || !formData.Address) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.Email)) {
      setError('กรุณากรอกอีเมลให้ถูกต้อง');
      return;
    }

    // Validate phone number length (10 digits)
    if (formData.Phone_No.length !== 10) {
      setError('กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/api/register', formData);
      setMessage('ลงทะเบียนสำเร็จ!');
      console.log('Response data:', response.data);
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

      <div className="m-6">
        <label className="block text-gray-700 mb-2">บ้านเลขที่</label>
        <input
          type="text"
          name="Home_ID"
          value={formData.Home_ID}
          onChange={handleChange}
          className="w-1/3 px-3 py-2 border rounded-full"
          placeholder="เลขที่บ้าน..."
          required
        />
      </div>

      <div className="m-5">
        <label className="block text-gray-700 mb-2">ที่อยู่</label>
        <textarea
          name="Address"
          value={formData.Address}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-2xl"
          placeholder="กรอกที่อยู่..."
          required
        ></textarea>
      </div>

      <button type="submit" className="w-full my-5 bg-green-700 text-white py-2 rounded-full">
        ลงทะเบียน
      </button>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {message && <p className="text-green-500 mb-4">{message}</p>}
    </form>
  );
};

export default RegisterForm;
