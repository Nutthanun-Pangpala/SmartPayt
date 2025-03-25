import axios from 'axios';
import React, { useEffect, useState } from 'react';
import '../index.css';

const ReportIssuesForm = () => {
  const [formData, setFormData] = useState({
    Issues: '', 
    lineUserId: '', 
    name: '' 
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // โหลดข้อมูลจาก localStorage
  useEffect(() => {
    const storedLineUserId = localStorage.getItem('lineUserId');
    const storedName = localStorage.getItem('lineUserName');

    if (storedLineUserId && storedName) {
      setFormData(prev => ({
        ...prev,
        lineUserId: storedLineUserId,
        name: storedName
      }));
    } else {
      setError('ไม่พบข้อมูลผู้ใช้ใน Local Storage');
    }
  }, []);

  // ฟังก์ชันจัดการการเปลี่ยนค่าในฟอร์ม
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ฟังก์ชันส่งข้อมูลไปยังเซิร์ฟเวอร์
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
  
    if (!formData.Issues.trim()) {
      setError('กรุณากรอกรายละเอียดปัญหาที่พบ');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/api/report-issue', formData);
      setMessage(response.data.message || 'ส่งคำร้องสำเร็จ!');
      setFormData({ Issues: '', lineUserId: formData.lineUserId, name: formData.name });
    } catch (error) {
      if (error.response) {
        setError(error.response.data.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      } else {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      }
      console.error('Report error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 drop-shadow-sm border rounded-xl">
      <div className="m-5">
        <label className="block text-gray-700 mb-2">รายงานปัญหาที่พบ</label>
        <textarea
          name="Issues"
          value={formData.Issues}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-2xl"
          placeholder="กรอกคำร้อง..."
          required
        ></textarea>
      </div>

      <button type="submit" className="w-full my-5 bg-green-700 text-white py-2 rounded-full">
        ส่งคำร้อง
      </button>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {message && <p className="text-green-500 mb-4">{message}</p>}
    </form>
  );
};

export default ReportIssuesForm;
