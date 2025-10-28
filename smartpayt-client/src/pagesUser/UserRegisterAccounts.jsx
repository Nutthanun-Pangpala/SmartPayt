import React from 'react';
import logo from '../assets/img/2-removebg-preview-2.png'; // (Path จากที่คุณส่งมา)
import RegisterUserForm from '../formUsers/RegisterUserForm';
import "../index.css";

// (เพิ่ม) Component สำหรับ Import ฟอนต์ Sarabun
const FontImporter = () => (
  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap');
  `}</style>
);

const RegisterAccount = () => {
  return (
    // (แก้ไข) ใช้ Layout ใหม่ (พื้นเทา, กลางจอ, บังคับฟอนต์)
    <div 
      className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4"
      style={{ fontFamily: "'Sarabun', sans-serif" }}
    >
      <FontImporter />
      
      {/* (แก้ไข) โลโก้และ Title จะอยู่ที่หน้านี้ */}
      <div className="text-center mb-6">
        <img className="w-auto h-60 mb-4" src={logo} alt="Logo" />
        <h2 className="text-2xl font-bold text-gray-800 mb-6">ลงทะเบียนผู้ใช้</h2>
      </div>
      
      {/* ฟอร์ม (ซึ่งตอนนี้จะเป็นแค่การ์ดสีขาว) */}
      <RegisterUserForm />
    </div>
  );
};

export default RegisterAccount;