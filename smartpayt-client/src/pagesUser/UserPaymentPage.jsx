import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NavbarComponent from "../assets/component/user/userNavbar";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bills, addressId } = location.state || {};

  const [selectedBills, setSelectedBills] = useState([]);

  if (!bills || bills.length === 0) {
    return <div className="text-red-500 p-4">ไม่พบข้อมูลบิลสำหรับชำระ</div>;
  }

  const toggleBillSelection = (billId) => {
    setSelectedBills((prev) =>
      prev.includes(billId)
        ? prev.filter((id) => id !== billId)
        : [...prev, billId]
    );
  };

  const selectedBillDetails = bills.filter((bill) =>
    selectedBills.includes(bill.id)
  );

  const totalAmount = selectedBillDetails.reduce(
    (sum, bill) => sum + parseFloat(bill.amount_due),
    0
  );

  const handleConfirmPayment = () => {
    if (selectedBills.length === 0) {
      alert("กรุณาเลือกบิลที่ต้องการชำระก่อน");
      return;
    }

    // TODO: ส่ง selectedBills ไปยัง backend เพื่อทำการชำระ
    alert(`ชำระเงินแล้วจำนวน ${totalAmount.toFixed(2)} บาท ✅`);
    navigate("/userDashboard");
  };

  return (
    <div className=' bg-gray-200 min-h-screen' >
    <NavbarComponent/>
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">💳 หน้าชำระค่าบริการ</h1>
      <p className="mb-2"><strong>🏠 ที่อยู่ ID:</strong> {addressId}</p>

      <div className="space-y-2 mb-4">
        {bills.map((bill, index) => (
          <div key={index} className="p-3 border bg-gray-100 rounded-md">
            <div>
              <p>💵 {bill.amount_due} บาท</p>
              <div className="flex ">
              <p className="mx-1">ครบกำหนด: {new Date(bill.due_date).toLocaleDateString("th-TH")}</p>
              </div>
            </div>
            {bill.status !== "1" && (
              <div className="flex items-center mt-2">
                <input
                  id={`checkbox-${bill.id}`}
                  type="checkbox"
                  checked={selectedBills.includes(bill.id)}
                  onChange={() => toggleBillSelection(bill.id)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`checkbox-${bill.id}`} className="ms-2 text-sm text-gray-900">
                  เลือกชำระบิลนี้
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mb-4 text-right text-lg font-semibold">
         ยอดรวมที่เลือก: {totalAmount.toFixed(2)} บาท
      </div>

      <button
        onClick={handleConfirmPayment}
        className="w-full text-white bg-green-600 hover:bg-green-700 font-semibold py-2 rounded"
      >
         ยืนยันการชำระเงิน
      </button>
    </div>
    </div>
  );
};

export default PaymentPage;
