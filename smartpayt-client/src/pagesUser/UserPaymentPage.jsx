import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NavbarComponent from "../assets/component/user/userNavbar";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bills, addressId } = location.state || {};

  const [allBills, setAllBills] = useState(bills || []);
  const [selectedBills, setSelectedBills] = useState([]); // เก็บ billId ที่เลือก (string)

  if (!bills || bills.length === 0) {
    return <div className="text-red-500 p-4">ไม่พบข้อมูลบิลสำหรับชำระ</div>;
  }

  // toggle เลือก/ไม่เลือกบิล โดยแปลง billId เป็น string เพื่อเทียบให้ตรงกับ selectedBills
  const toggleBillSelection = (billId) => {
    const strId = String(billId);
    setSelectedBills((prev) =>
      prev.includes(strId)
        ? prev.filter((id) => id !== strId)
        : [...prev, strId]
    );
  };

  // เลือกบิลที่ถูกติ๊กถูก
  const selectedBillDetails = allBills.filter((bill) =>
    selectedBills.includes(String(bill.id))
  );

  // คำนวณยอดรวม
  const totalAmount = selectedBillDetails.reduce(
    (sum, bill) => sum + parseFloat(bill.amount_due),
    0
  );

  const handleConfirmPayment = async () => {
    if (selectedBills.length === 0) {
      alert("กรุณาเลือกบิลที่ต้องการชำระก่อน");
      return;
    }

    try {
      // เรียก API ชำระบิล
      const response = await fetch(`http://localhost:3000/api/bills/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address_id: addressId,
          billIds: selectedBills,
        }),
      });

      if (!response.ok) throw new Error("อัปเดตไม่สำเร็จ");

      // ดึงข้อมูลบิลใหม่หลังชำระ เพื่ออัปเดต UI
      const updatedData = await fetch(
        `http://localhost:3000/api/bills?address_id=${addressId}`
      );
      if (!updatedData.ok) throw new Error("ไม่สามารถดึงข้อมูลบิลใหม่ได้");
      const dataJson = await updatedData.json();

      setAllBills(dataJson.bills);
      setSelectedBills([]);

      alert(`ชำระเงินแล้วจำนวน ${totalAmount.toFixed(2)} บาท ✅`);
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการชำระเงิน ❌");
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
          {allBills.map((bill) => (
            <div
              key={bill.id} // ใช้ bill.id เป็น key จะดีและถูกต้องกว่า index
              className="p-3 border bg-gray-100 rounded-md"
            >
              <div>
                <p>💵 {bill.amount_due} บาท</p>
                <p className="mx-1">
                  📅 ครบกำหนด:{" "}
                  {new Date(bill.due_date).toLocaleDateString("th-TH")}
                </p>
                <p className="mx-1">
                  📌 สถานะ: {bill.status === "1" ? "✅ ชำระแล้ว" : "⏳ ยังไม่ชำระ"}
                </p>
              </div>
              {bill.status !== "1" && (
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
          className="w-full text-white bg-green-600 hover:bg-green-700 font-semibold py-2 rounded"
        >
          ยืนยันการชำระเงิน
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;
