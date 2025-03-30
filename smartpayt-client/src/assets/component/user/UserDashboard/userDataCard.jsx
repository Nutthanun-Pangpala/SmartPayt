import "@flaticon/flaticon-uicons/css/all/all.css";
import axios from 'axios';
import React, { useEffect, useState } from 'react';


const UserDatacard = () => {
  const [userData, setUserData] = useState(null); 
  const [error, setError] = useState('');
  
  // ดึง lineUserId จาก localStorage
  const lineUserId = localStorage.getItem("lineUserId");

  useEffect(() => {
    if (!lineUserId) {
      setError("ไม่พบข้อมูลการเข้าสู่ระบบ");
      return;
    }

    // ดึงข้อมูลผู้ใช้
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/user/${lineUserId}`);
        setUserData(response.data.user);
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:", error);
        setError("ไม่สามารถดึงข้อมูลผู้ใช้ได้");
      }
    };


    fetchUserData();
  }, [lineUserId]); // เรียกเมื่อ component โหลด

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!userData) {
    return <div className="text-gray-700">กำลังโหลดข้อมูล...</div>;
  }

  return (
        <div className="dashboard bg-white shadow mx-3 rounded-lg mb-4 mt-3 flex">
          <div className=" b bg-green-700 w-3 max-h-full rounded-l-lg"></div>
          <div className="  my-3 mx-2">
            <div className="flex">
              <p>
              <i className="fi fi-sr-user m-2 text-xl  font-bold"></i>ชื่อ-นามสกุล : {userData.name}</p>
            </div>
            <div className="flex">
              <p>
              <i className="fi fi-sr-credit-card mx-2 my-1"></i>เลขบัตรประชาชน : {userData.ID_card_No}</p>
            </div>
            <div className="flex">
              <p>
              <i className="fi fi-ss-phone-call mx-2 my-1"></i>เบอร์โทรศัพท์ : {userData.Phone_No}</p>
            </div>
            <div className="flex">
              <p className="text-blue-600">
            <i className="fi fi-sr-envelope mx-2 my-1 text-blue-600"></i>อีเมล์ : {userData.Email}</p>
            </div>
          </div>
          
        </div>
  );
};

export default UserDatacard;
