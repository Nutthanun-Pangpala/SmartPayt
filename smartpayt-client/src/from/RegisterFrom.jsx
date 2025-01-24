import axios from 'axios';
import React, { useState } from 'react';
import '../index.css';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    ID_card_No: '',
    Phone_No: '',
    Email: '',
    Home_ID: '',
    Address: '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
  
    // ตรวจสอบว่าไม่มีข้อมูลใดๆ ขาด
    if (!formData.ID_card_No || !formData.Phone_No || !formData.Email || !formData.Home_ID || !formData.Address) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
  
    try {
      // ส่งข้อมูลไปยัง API โดยไม่ใช้ data ซ้อน
      const response = await axios.post('http://localhost:3000/api/register', {
        ID_card_No: Number(formData.ID_card_No), // แปลงเป็นตัวเลข
        Phone_No: Number(formData.Phone_No), // แปลงเป็นตัวเลข
        Email: formData.Email,
        Home_ID: formData.Home_ID,
        Address: formData.Address, // ส่งเป็นข้อความธรรมดา
      });
  
      // ตั้งข้อความสำเร็จ
      setMessage('ลงทะเบียนสำเร็จ!');
      console.log('Response data:', response.data);
    } catch (error) {
      // แสดงข้อผิดพลาด
      if (error.response) {
        // ถ้าเซิร์ฟเวอร์ตอบกลับข้อผิดพลาด
        setError(error.response.data.message || 'เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่');
      } else {
        // ถ้าหากไม่มีการตอบกลับจากเซิร์ฟเวอร์
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      }
      console.error('Registration error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 drop-shadow-sm border rounded-xl ">

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
          pattern="\d*"
          title="Please enter a valid ID card number."
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
          pattern="\d*"
          title="Please enter a valid phone number."
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
