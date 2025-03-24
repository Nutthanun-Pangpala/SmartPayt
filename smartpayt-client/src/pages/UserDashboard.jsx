import axios from 'axios';
import React, { useEffect, useState } from 'react';

const UserDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  
  // ดึง lineUserId จาก localStorage
  const lineUserId = localStorage.getItem("lineUserId");

  useEffect(() => {
    if (!lineUserId) {
      setError("ไม่พบข้อมูลการเข้าสู่ระบบ");
      return;
    }

    // เรียก API เพื่อนำข้อมูลผู้ใช้มาแสดง
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/user/${lineUserId}`);
        setUserData(response.data.user);  // บันทึกข้อมูลผู้ใช้ที่ได้
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:", error);
        setError("ไม่สามารถดึงข้อมูลผู้ใช้ได้");
      }
    };

    fetchUserData();
  }, [lineUserId]); // เรียกเมื่อ component โหลด

  if (error) {
    return <div>{error}</div>;
  }

  if (!userData) {
    return <div>กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="dashboard">
      <h1>ยินดีต้อนรับ {userData.name}</h1>
      <p>เลขบัตรประชาชน: {userData.ID_card_No}</p>
      <p>เบอร์โทรศัพท์: {userData.Phone_No}</p>
      <p>อีเมล: {userData.Email}</p>
      {/* ข้อมูลเพิ่มเติมจากฐานข้อมูล */}
    </div>
  );
};

export default UserDashboard;
