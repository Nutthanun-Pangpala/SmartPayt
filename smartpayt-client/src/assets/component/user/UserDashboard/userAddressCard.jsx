import axios from 'axios';
import React, { useEffect, useState } from 'react';

const UserAddressesCard = () => {
  const [userAddresses, setUserAddresses] = useState([]); // ✅ เปลี่ยนเป็น array
  const [error, setError] = useState('');
  
  // ดึง lineUserId จาก localStorage
  const lineUserId = localStorage.getItem("lineUserId");

  useEffect(() => {
    if (!lineUserId) {
      setError("ไม่พบข้อมูลการเข้าสู่ระบบ");
      return;
    }

    // ดึงข้อมูลที่อยู่ (หลายรายการ)
    const fetchUserAddresses = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/address/${lineUserId}`);
        setUserAddresses(response.data.addresses);  // ✅ รับ array
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูลที่อยู่:", error);
        setError("ไม่สามารถดึงข้อมูลที่อยู่ได้");
      }
    };
    fetchUserAddresses();
  }, [lineUserId]); // เรียกเมื่อ component โหลด

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!userAddresses.length === 0) {
    return <div className="text-gray-700">กำลังโหลดข้อมูล...</div>;
  }

  return (
        <div className="AddressCard p-4  rounded-lg max-h-full">
          <h1 className="text-lg font-bold">ที่อยู่ของคุณ</h1>
          {userAddresses.map((address, index) => (
            <div key={index} className="border  my-2 bg-white rounded-lg p-3">
              <p>🏠 บ้านเลขที่: {address.house_no}</p>
              <p>📍 รายละเอียดที่อยู่: {address.address_detail}</p>
            </div>
          ))}
        </div>
  );
};

export default UserAddressesCard;
