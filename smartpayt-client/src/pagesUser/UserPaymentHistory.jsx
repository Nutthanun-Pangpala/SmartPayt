import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import NavbarComponent from "../assets/component/user/userNavbar";
import BottomNav from "../assets/component/user/userNavigate";

// Helper สำหรับสร้างรายการเดือน
const generateMonthOptions = () => {
    const months = [];
    for (let i = 0; i < 12; i++) {
        const date = new Date(2000, i, 1);
        months.push({ 
            value: i + 1, 
            label: date.toLocaleDateString("th-TH", { month: "long" }) 
        });
    }
    return months;
};
const MONTH_OPTIONS = generateMonthOptions();
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]; // ย้อนหลัง 3 ปี

export default function PaymentHistory() {
  const { lineUserId } = useParams();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // === ✅ FIX: ตั้งค่าเริ่มต้นเป็น 0 (ทั้งหมด) ทั้งคู่ ===
  const [selectedMonth, setSelectedMonth] = useState(0); 
  const [selectedYear, setSelectedYear] = useState(0); 
  // ------------------------------------------

  useEffect(() => {
    if (!lineUserId) return;
    setLoading(true);
    // 💡 ควรเปลี่ยนไปใช้ import api from '../api' เพื่อให้จัดการ Token อัตโนมัติ (ถ้ามี)
    // แต่ในโค้ดนี้ยังใช้ axios ดั้งเดิมตามโค้ดของคุณ
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/api/payment-history/${lineUserId}`)
      .then((res) => {
        // Assume res.data is an array of bills
        setHistory(res.data || []);
        setError("");
      })
      .catch((err) => {
        console.error(err);
        setError("โหลดประวัติการชำระเงินไม่สำเร็จ");
      })
      .finally(() => setLoading(false));
  }, [lineUserId]);

  // ==== Utils ====
  const formatDateTH = (d) =>
    d
      ? new Date(d).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "ไม่ระบุ";

  const formatTHB = (n) =>
    isNaN(Number(n)) ? "0.00" : Number(n).toLocaleString("th-TH", { minimumFractionDigits: 2 });

  const formatKG = (n) =>
    isNaN(Number(n)) ? "0.00" : Number(n).toLocaleString("th-TH", { minimumFractionDigits: 2 });

  // === ✅ NEW FILTER LOGIC: กรองตาม Month/Year (FIXED) ===
  const filtered = useMemo(() => {
    if (!history?.length) return [];

    // ถ้า month/year เป็น 0 (เลือก 'ทั้งหมด') ให้แสดงทั้งหมด
    if (selectedMonth === 0 && selectedYear === 0) return history;

    return history.filter((item) => {
        // ✅ FIX: ใช้ parseInt เพื่อรับประกันว่า billMonth/billYear เป็นเลขจำนวนเต็ม
        const billMonth = parseInt(item.month, 10);
        const billYear = parseInt(item.year, 10);
        
        // ถ้า month หรือ year ไม่ใช่ตัวเลขที่ถูกต้อง (NaN) ให้ถือว่าไม่ match
        if (isNaN(billMonth) || isNaN(billYear)) return false; 
        
        let passMonth = true;
        let passYear = true;

        // ถ้าเลือกเดือนเฉพาะ
        if (selectedMonth !== 0) {
            passMonth = billMonth === selectedMonth;
        }

        // ถ้าเลือกปีเฉพาะ
        if (selectedYear !== 0) {
            passYear = billYear === selectedYear;
        }
        
        return passMonth && passYear;
    });
  }, [history, selectedMonth, selectedYear]);
  // ------------------------------------------

  const summary = useMemo(() => {
    const total = filtered.reduce((s, it) => s + Number(it.amount_due || 0), 0);
    const paidCount = filtered.filter((it) => Number(it.status) === 1).length;
    const unpaidCount = filtered.filter((it) => Number(it.status) !== 1).length;
    return { total, paidCount, unpaidCount, count: filtered.length };
  }, [filtered]);

  // ====== Download helpers (ไม่เปลี่ยนแปลงมากนัก) ======
  // 1) ใบเสร็จแบบ HTML -> Print to PDF
  const openReceiptWindow = (bill) => {
    const isPaid = Number(bill.status) === 1;
    const win = window.open("", "_blank"); // เปิดทันทีจาก event handler เพื่อลดโอกาสโดนบล็อค
    if (!win) return alert("เบราว์เซอร์บล็อคป๊อปอัป กรุณาอนุญาตเปิดหน้าต่างใหม่");

    const html = `
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Receipt - SmartPayt</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;700&display=swap');
  body{ font-family: 'Noto Sans Thai', system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; background:#f4f4f4; color:#111; padding:24px; }
  .wrap{ max-width:720px; margin:0 auto; background:#fff; border:1px solid #e5e7eb; border-radius:16px; padding:24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
  .brand{ display:flex; align-items:center; justify-content:space-between; border-bottom: 2px solid #047857; padding-bottom: 10px; }
  .brand h1{ margin:0; font-size:24px; color:#047857; font-weight:700; }
  .badge{ display:inline-block; border-radius:999px; padding:6px 12px; font-size:12px; border:1px solid #10b981; color:#065f46; background:#ecfdf5; font-weight: bold; }
  .meta{ margin-top:16px; font-size:14px; color:#374151; line-height: 1.5; }
  .meta div b{ font-weight:700; color:#1f2937; }
  
  .section-title { margin-top: 24px; margin-bottom: 8px; font-size: 16px; font-weight: 600; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }

  table{ width:100%; border-collapse:collapse; margin-top:16px; }
  th, td{ padding:10px 12px; font-size:14px; text-align:left; }
  .table-data td { border-bottom:1px solid #f3f4f6; }
  .table-data tr:last-child td { border-bottom: none; }

  .right{ text-align:right; }
  .total-row td { border-top: 2px solid #e5e7eb; font-size: 16px; }
  .total{ font-weight:700; color:#065f46; }
  .footer{ margin-top:30px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size:12px; color:#6b7280; text-align: center; }
  .muted{ color:#6b7280; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="brand">
      <h1>SmartPayt | ใบเสร็จรับเงิน</h1>
      <span class="badge">${isPaid ? "ชำระแล้ว" : "ยังไม่ชำระ"}</span>
    </div>

    <div class="meta">
      <div>เลขที่บิล: <b>${bill.id ?? "-"}</b></div>
      <div>ที่อยู่ (ID): <b>${bill.address_id ?? "-"}</b></div>
      <div>วันครบกำหนด: <b>${formatDateTH(bill.due_date)}</b></div>
      <div>รอบบิล: <b>เดือน ${bill.month}/${bill.year}</b></div>
    </div>

    <div class="section-title">สรุปปริมาณขยะ (กิโลกรัม)</div>
    <table class="table-data">
        <tbody>
            <tr>
                <td>ขยะทั่วไป (General)</td>
                <td class="right total">${formatKG(bill.total_general_kg)} กก.</td>
            </tr>
            <tr>
                <td>ขยะอันตราย (Hazardous)</td>
                <td class="right total">${formatKG(bill.total_hazardous_kg)} กก.</td>
            </tr>
            <tr>
                <td>ขยะรีไซเคิล (Recyclable)</td>
                <td class="right total">${formatKG(bill.total_recyclable_kg)} กก.</td>
            </tr>
            <tr>
                <td>ขยะอินทรีย์ (Organic)</td>
                <td class="right total">${formatKG(bill.total_organic_kg)} กก.</td>
            </tr>
        </tbody>
    </table>

    <div class="section-title">รายละเอียดค่าบริการ</div>
    <table class="table-data">
      <thead>
        <tr>
          <th>รายการ</th>
          <th class="right">จำนวนเงิน (บาท)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>รวมค่าบริการ (คำนวณจากน้ำหนัก)</td>
          <td class="right">${formatTHB(bill.amount_due)}</td>
        </tr>
        <tr class="total-row">
          <td class="total">รวมทั้งสิ้น</td>
          <td class="right total">${formatTHB(bill.amount_due)}</td>
        </tr>
      </tbody>
    </table>
    
    <div class="footer">
      * ใบเสร็จนี้สร้างจากระบบ SmartPayt ตามข้อมูลในประวัติการชำระเงิน<br/>
      อัปเดตข้อมูลล่าสุด: ${formatDateTH(bill.updated_at)}
    </div>
  </div>

  <script>
    // สั่งพิมพ์
    window.onload = () => {
      setTimeout(() => {
        window.print();
        // ปิดหน้าต่างหลังจากสั่งพิมพ์
        setTimeout(() => window.close(), 300); 
      }, 200);
    };
  </script>
</body>
</html>
    `.trim();

    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  // 2) ดาวน์โหลด CSV ของ "รายการที่กรองไว้"
  const downloadCSV = () => {
    if (!filtered.length) return;
    const header = ["bill_id", "address_id", "due_date", "amount_thb", "status", "general_kg", "hazardous_kg", "recyclable_kg", "organic_kg"];
    const rows = filtered.map((b) => [
      b.id ?? "",
      b.address_id ?? "",
      formatDateTH(b.due_date),
      Number(b.amount_due || 0),
      Number(b.status) === 1 ? "PAID" : "UNPAID",
      Number(b.total_general_kg || 0),
      Number(b.total_hazardous_kg || 0),
      Number(b.total_recyclable_kg || 0),
      Number(b.total_organic_kg || 0),
    ]);
    const csv = [header, ...rows].map((r) => r.map(String).map((s) => `"${s.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // 💡 แก้ชื่อไฟล์ CSV ให้แสดงเดือน/ปี ที่กรองแทนช่วงวันที่
    a.download = `payment_history_${selectedYear}_${selectedMonth}.csv`; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <NavbarComponent />

      <main
        className="mx-auto w-full max-w-screen-sm md:max-w-2xl px-4 md:px-6 pt-5 pb-28"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 7rem)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-wide text-black">
            ประวัติการชำระเงิน
          </h1>
          {/* ดาวน์โหลด CSV ทั้งช่วง */}
          <button
            onClick={downloadCSV}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-sm hover:bg-emerald-50"
            disabled={!filtered.length}
            title={!filtered.length ? "ไม่มีข้อมูลในช่วงที่เลือก" : "ดาวน์โหลด CSV"}
          >
            <i className="fi fi-rr-download"></i>
            CSV
          </button>
        </div>

        {/* ✅ NEW FILTER: Month/Year Picker */}
        <section className="rounded-2xl border border-emerald-100 bg-white/80 backdrop-blur p-4 md:p-5 shadow-sm mb-4">
          <h3 className="font-semibold mb-2 text-gray-700">กรองตามรอบบิล</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="text-xs text-gray-500 block mb-1">เดือน</label>
                <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="border rounded-lg px-3 py-2 w-full text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                >
                    <option value={0}>-- ทั้งหมด --</option>
                    {MONTH_OPTIONS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="text-xs text-gray-500 block mb-1">ปี พ.ศ.</label>
                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="border rounded-lg px-3 py-2 w-full text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                >
                    <option value={0}>-- ทั้งหมด --</option>
                    {YEAR_OPTIONS.map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>
          </div>
        </section>

        {/* การ์ดสรุปยอด */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-xs text-gray-500">ยอดรวม</div>
            <div className="text-xl font-semibold text-emerald-700">฿{formatTHB(summary.total)}</div>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-xs text-gray-500">รายการทั้งหมด</div>
            <div className="text-xl font-semibold">{summary.count} รายการ</div>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-xs text-gray-500">สถานะ</div>
            <div className="text-sm mt-1">
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> ชำระแล้ว: {summary.paidCount}
              </span>
            </div>
            <div className="text-sm">
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> ยังไม่ชำระ: {summary.unpaidCount}
              </span>
            </div>
          </div>
        </section>

        {/* รายการ */}
        <section>
          {loading ? (
            <ul className="space-y-3">
              {[1, 2, 3].map((i) => (
                <li key={i} className="bg-white border rounded-2xl p-4 shadow-sm animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </li>
              ))}
            </ul>
          ) : error ? (
            <div className="text-center text-red-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-gray-500">ยังไม่มีรายการในช่วงที่เลือก</div>
          ) : (
            <ul className="space-y-3">
              {filtered
                .slice()
                .sort((a, b) => new Date(b.due_date || b.created_at || 0) - new Date(a.due_date || a.created_at || 0))
                .map((item) => {
                  const isPaid = Number(item.status) === 1;
                  return (
                    <li key={item.id} className="bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b pb-3 mb-3">
                        <div className="flex-1">
                          <div className="text-sm text-gray-500">
                            รอบบิล: เดือน {item.month ?? 'N/A'}/{item.year ?? 'N/A'} (กำหนด: {formatDateTH(item.due_date)})
                          </div>
                          <div className="text-xl font-bold text-gray-900">
                            ฿{formatTHB(item.amount_due)}
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                          isPaid
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-amber-50 text-amber-700 border border-amber-100"
                        }`}>
                          {isPaid ? "ชำระแล้ว" : "ยังไม่ชำระ"}
                        </span>
                      </div>

                      {/* รายละเอียดน้ำหนักขยะ (ส่วนที่เพิ่มเข้ามา) */}
                      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-700 font-medium bg-gray-50 p-3 rounded-lg">
                        <div className="col-span-2 text-xs text-gray-500 font-semibold mb-1">สรุปปริมาณขยะที่ถูกคิดเงิน:</div>
                        <p className="flex items-center gap-1">
                           <span className="text-lg">🗑️</span> ทั่วไป: <span className="font-bold text-gray-900">{formatKG(item.total_general_kg)}</span> กก.
                        </p>
                        <p className="flex items-center gap-1">
                           <span className="text-lg">🛢️</span> อันตราย: <span className="font-bold text-gray-900">{formatKG(item.total_hazardous_kg)}</span> กก.
                        </p>
                        <p className="flex items-center gap-1">
                           <span className="text-lg">♻️</span> รีไซเคิล: <span className="font-bold text-gray-900 text-emerald-600">{formatKG(item.total_recyclable_kg)}</span> กก.
                        </p>
                        <p className="flex items-center gap-1">
                           <span className="text-lg">🌱</span> อินทรีย์: <span className="font-bold text-gray-900">{formatKG(item.total_organic_kg)}</span> กก.
                        </p>
                      </div>

                      {/* ปุ่มดาวน์โหลดใบเสร็จ */}
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => openReceiptWindow(item)}
                          className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                          title="พิมพ์/บันทึกเป็น PDF"
                        >
                          <i className="fi fi-rr-file-download" />
                          ดาวน์โหลดใบเสร็จ (PDF)
                        </button>
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}