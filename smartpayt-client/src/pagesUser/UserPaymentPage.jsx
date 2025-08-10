import axios from "axios";
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NavbarComponent from "../assets/component/user/userNavbar";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bills, addressId } = location.state || {};

  const [selectedBills, setSelectedBills] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!bills || bills.length === 0) {
    return <div className="text-red-500 p-4">ไม่พบข้อมูลบิลสำหรับชำระ</div>;
  }

  const toggleBillSelection = (billId) => {
    const strId = String(billId);
    setSelectedBills((prev) =>
      prev.includes(strId)
        ? prev.filter((id) => id !== strId)
        : [...prev, strId]
    );
  };

  const selectedBillDetails = bills.filter((bill) =>
    selectedBills.includes(String(bill.id))
  );

  const totalAmount = selectedBillDetails.reduce(
    (sum, bill) => sum + (parseFloat(bill.amount_due) || 0),
    0
  );

  const handleConfirmPayment = async () => {
    if (selectedBills.length === 0) {
      alert("กรุณาเลือกบิลที่ต้องการชำระก่อน");
      return;
    }

    try {
      setLoading(true);

      // ยิงไป backend เพื่อสร้าง QR
      const res = await axios.post("http://localhost:3000/gbprimepay/create-qr", {
        amount: totalAmount.toFixed(2),
        referenceNo: `BILL-${Date.now()}` // ใช้ timestamp กันซ้ำ
      });

      // ไปหน้า QR พร้อมข้อมูลที่ backend ส่งมา
      navigate("/payment/qr", {
        state: {
          selectedBills,
          totalAmount,
          qrData: res.data
        },
      });

    } catch (error) {
      console.error(error);
      alert("ไม่สามารถสร้าง QR ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-200 min-h-screen">
      <NavbarComponent />
      <div className="p-4 max-w-xl mx-auto">
        <h1 className="text-xl font-bold mb-4">💳 หน้าชำระค่าบริการ</h1>
        <p className="mb-2">
          <strong>🏠 ที่อยู่ ID:</strong> {addressId}
        </p>

        <div className="space-y-2 mb-4">
          {bills.map((bill) => (
            <div key={bill.id} className="p-3 border bg-gray-100 rounded-md">
              <p>💵 {bill.amount_due} บาท</p>
              <div className="flex">
                <p className="mx-1">
                  ครบกำหนด: {new Date(bill.due_date).toLocaleDateString("th-TH")}
                </p>
              </div>
              {bill.status !== "1" && bill.status !== 1 && bill.status !== "2" && bill.status !== 2 && (
                <div className="flex items-center mt-2">
                  <input
                    id={`checkbox-${bill.id}`}
                    type="checkbox"
                    checked={selectedBills.includes(String(bill.id))}
                    onChange={() => toggleBillSelection(bill.id)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`checkbox-${bill.id}`}
                    className="ms-2 text-sm text-gray-900"
                  >
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
          disabled={loading}
          className="w-full text-white bg-green-600 hover:bg-green-700 font-semibold py-2 rounded"
        >
          {loading ? "กำลังสร้าง QR..." : "ยืนยันการชำระเงิน"}
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;
