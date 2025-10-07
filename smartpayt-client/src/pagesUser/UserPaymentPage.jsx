import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NavbarComponent from "../assets/component/user/userNavbar";

const formatTHB = (n) =>
  isNaN(Number(n))
    ? "0.00"
    : Number(n).toLocaleString("th-TH", { minimumFractionDigits: 2 });

const StatusBadge = ({ status }) => {
  const s = String(status);
  if (s === "1")
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
        ชำระแล้ว
      </span>
    );
  if (s === "2")
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
        รอตรวจสอบ
      </span>
    );
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
      ยังไม่ชำระ
    </span>
  );
};

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { bills, addressId } = location.state || {};

  const [allBills] = useState(bills || []);
  const [selectedBills, setSelectedBills] = useState([]);
  const [isPaying, setIsPaying] = useState(false);

  if (!allBills || allBills.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarComponent />
        <div className="max-w-lg mx-auto px-4 pt-10">
          <div className="rounded-2xl border bg-white p-6 text-center">
            <div className="text-red-500 font-semibold">ไม่พบข้อมูลบิลสำหรับชำระ</div>
          </div>
        </div>
      </div>
    );
  }

  // เรียงตามวันครบกำหนด (ล่าสุดอยู่ล่างสุด)
  const sortedBills = useMemo(
    () =>
      allBills
        .slice()
        .sort(
          (a, b) =>
            new Date(a.due_date || 0) - new Date(b.due_date || 0)
        ),
    [allBills]
  );

  const selectableBills = useMemo(
    () => sortedBills.filter((b) => String(b.status) === "0"),
    [sortedBills]
  );

  const selectedBillDetails = useMemo(
    () => sortedBills.filter((b) => selectedBills.includes(String(b.id))),
    [sortedBills, selectedBills]
  );

  const totalAmount = useMemo(
    () =>
      selectedBillDetails.reduce(
        (sum, bill) => sum + (parseFloat(bill.amount_due) || 0),
        0
      ),
    [selectedBillDetails]
  );

  const toggleBillSelection = (billId) => {
    const strId = String(billId);
    setSelectedBills((prev) =>
      prev.includes(strId) ? prev.filter((id) => id !== strId) : [...prev, strId]
    );
  };

  const toggleSelectAll = () => {
    const allIds = selectableBills.map((b) => String(b.id));
    const isAllSelected = allIds.every((id) => selectedBills.includes(id));
    setSelectedBills(isAllSelected ? [] : allIds);
  };

  const handleConfirmPayment = () => {
    if (selectedBills.length === 0) {
      alert("กรุณาเลือกบิลที่ต้องการชำระก่อน");
      return;
    }
    setIsPaying(true);
    navigate("/payment/qr", {
      state: {
        selectedBills,
        totalAmount,
      },
    });
  };

  const allSelected =
    selectableBills.length > 0 &&
    selectableBills.every((b) => selectedBills.includes(String(b.id)));

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <NavbarComponent />

      <main
        className="mx-auto w-full max-w-screen-sm md:max-w-lg px-4 md:px-6 pt-5 pb-36"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 9rem)" }}
      >
        {/* หัวเรื่อง + ชิปที่อยู่ */}
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-700">
            หน้าชำระค่าบริการ
          </h1>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 text-xs px-3 py-1 border border-emerald-200">
            <i className="fi fi-ss-marker" />
            ที่อยู่ ID : <span className="font-semibold">{addressId}</span>
          </div>
        </div>

        {/* แถบเลือกทั้งหมด + จำนวนเลือก */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              id="select-all"
              type="checkbox"
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              checked={allSelected}
              disabled={selectableBills.length === 0}
              onChange={toggleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm md:text-base">
              เลือกทั้งหมด ({selectedBills.length}/{selectableBills.length})
            </label>
          </div>
          <div className="text-sm text-gray-500">
            บิลทั้งหมด: {sortedBills.length}
          </div>
        </div>

        {/* รายการบิล */}
        <ul className="space-y-3">
          {sortedBills.map((bill) => {
            const s = String(bill.status);
            const selectable = s === "0"; // ยังไม่ชำระ → เลือกได้
            const checked = selectedBills.includes(String(bill.id));
            return (
              <li
                key={bill.id}
                className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500">ครบกำหนด</div>
                    <div className="text-lg font-semibold">
                      {new Date(bill.due_date).toLocaleDateString("th-TH", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <StatusBadge status={bill.status} />
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm text-gray-500">จำนวนเงิน</div>
                  <div className="text-2xl font-bold text-emerald-700">
                    ฿{formatTHB(bill.amount_due)}
                  </div>
                </div>

                {/* เลือกชำระ */}
                {s !== "1" && (
                  <div className="mt-3 flex items-center">
                    <input
                      id={`checkbox-${bill.id}`}
                      type="checkbox"
                      className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                      checked={checked}
                      disabled={!selectable}
                      onChange={() => toggleBillSelection(bill.id)}
                    />
                    <label
                      htmlFor={`checkbox-${bill.id}`}
                      className={`ms-2 text-sm ${
                        selectable ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {selectable ? "เลือกชำระบิลนี้" : "ไม่สามารถเลือกได้"}
                    </label>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </main>

      {/* แถบสรุปยอดติดล่าง */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="mx-auto w-full max-w-screen-sm md:max-w-lg px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">ยอดรวมที่เลือก</div>
              <div className="text-2xl font-bold text-emerald-700">
                ฿{formatTHB(totalAmount)}
              </div>
            </div>
            <button
              onClick={handleConfirmPayment}
              disabled={selectedBills.length === 0 || isPaying}
              className={`inline-flex items-center justify-center px-5 py-3 rounded-xl font-semibold text-white transition
                ${
                  selectedBills.length === 0 || isPaying
                    ? "bg-emerald-300 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
            >
              <i className="fi fi-sr-credit-card mr-2" />
              {isPaying ? "กำลังไปหน้าชำระ..." : "ยืนยันการชำระเงิน"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
