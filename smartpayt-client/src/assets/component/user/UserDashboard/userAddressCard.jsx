import axios from "axios";
import React, { useEffect, useState } from "react";

const UserAddressesCard = () => {
  const [userAddresses, setUserAddresses] = useState([]);
  const [billsMap, setBillsMap] = useState({});
  const [expanded, setExpanded] = useState({});
  const [error, setError] = useState("");

  const lineUserId = localStorage.getItem("lineUserId");

  useEffect(() => {
    if (!lineUserId) {
      setError("ไม่พบข้อมูลการเข้าสู่ระบบ");
      return;
    }

    const fetchUserAddresses = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/address/${lineUserId}`);
        const addresses = response.data.addresses;
        setUserAddresses(addresses);

        // ✅ โหลดบิลของทุกบ้านพร้อมกัน
        const billsData = await Promise.all(
          addresses.map(async (address) => {
            try {
              const res = await axios.get(`http://localhost:3000/api/bills/${address.address_id}`);
              const unpaidBills = res.data.bills.filter((bill) => bill.status !== "paid"); // กรองเฉพาะบิลที่ยังไม่ชำระ
              return { address_id: address.address_id, bills: unpaidBills };
            } catch (error) {
              console.error(`เกิดข้อผิดพลาดในการดึงบิลของบ้าน ${address.address_id}:`, error);
              return { address_id: address.address_id, bills: [] };
            }
          })
        );

        // ✅ อัปเดต billsMap พร้อมกัน ลดการ re-render
        const billsMapData = billsData.reduce((acc, { address_id, bills }) => {
          acc[address_id] = bills;
          return acc;
        }, {});

        setBillsMap(billsMapData);
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูลที่อยู่:", error);
        setError("ไม่สามารถดึงข้อมูลที่อยู่ได้");
      }
    };

    fetchUserAddresses();
  }, [lineUserId]);

  const toggleExpand = (address_id) => {
    setExpanded((prev) => ({
      ...prev,
      [address_id]: !prev[address_id],
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-"; // ถ้าไม่มีวันที่ให้แสดง "-"
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="AddressCard p-4 rounded-lg max-h-full">
      <h1 className="text-lg font-bold">ที่อยู่ของคุณ</h1>
      {userAddresses.map((address) => {
        const totalAmount = Array.isArray(billsMap[address.address_id])
          ? billsMap[address.address_id].reduce((sum, bill) => sum + (Number(bill.amount_due) || 0), 0)
          : 0;
        const formattedTotal = totalAmount.toFixed(2);

        return (
          <div key={address.address_id} className="border my-2 bg-white rounded-lg p-3">
            <div onClick={() => toggleExpand(address.address_id)} className="cursor-pointer">
              <p>🏠 บ้านเลขที่: {address.house_no}</p>
              <p>📍 รายละเอียดที่อยู่: {address.address_detail}</p>
              <p className="font-bold text-red-600">💰 ยอดรวมค่าบิล: {formattedTotal} บาท</p>
            </div>

            {expanded[address.address_id] && (
              <div className="mt-3">
                <h2 className="text-md font-semibold">📄 รายละเอียดบิล:</h2>
                {billsMap[address.address_id]?.length > 0 ? (
                  billsMap[address.address_id].map((bill, index) => (
                    <div key={index} className="mt-2 p-2 border bg-gray-100 rounded-md">
                      <p>💰 จำนวนเงิน: {bill.amount_due} บาท</p>
                      <p>⏳ วันที่ครบกำหนด: {formatDate(bill.due_date)}</p>
                      <p className="font-semibold">สถานะ: {bill.status}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">ไม่มีบิลที่ต้องชำระ</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default UserAddressesCard;
