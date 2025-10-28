import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import NavbarComponent from "../assets/component/user/userNavbar";
import BottomNav from "../assets/component/user/userNavigate";

export default function PaymentHistory() {
  const { lineUserId } = useParams();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // === ช่วงวันที่เริ่มต้น ===
  const todayISO = new Date().toISOString().slice(0, 10);
  const startOfMonthISO = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [fromDate, setFromDate] = useState(startOfMonthISO);
  const [toDate, setToDate] = useState(todayISO);

  useEffect(() => {
    if (!lineUserId) return;
    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/api/payment-history/${lineUserId}`)
      .then((res) => {
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

  const inRange = (dateStr, fromStr, toStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const f = fromStr ? new Date(fromStr) : null;
    const t = toStr ? new Date(toStr) : null;
    d.setHours(0, 0, 0, 0);
    if (f) f.setHours(0, 0, 0, 0);
    if (t) t.setHours(0, 0, 0, 0);
    return (f ? d >= f : true) && (t ? d <= t : true);
  };

  // ปุ่มลัดช่วงเวลา
  const quickSet = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    setFromDate(start.toISOString().slice(0, 10));
    setToDate(end.toISOString().slice(0, 10));
  };
  const setThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setFromDate(start.toISOString().slice(0, 10));
    setToDate(end.toISOString().slice(0, 10));
  };

  // === กรอง + สรุป ===
  const filtered = useMemo(() => {
    if (!history?.length) return [];
    return history.filter((item) =>
      inRange(item.due_date || item.paid_at || item.created_at, fromDate, toDate)
    );
  }, [history, fromDate, toDate]);

  const summary = useMemo(() => {
    const total = filtered.reduce((s, it) => s + Number(it.amount_due || 0), 0);
    const paidCount = filtered.filter((it) => Number(it.status) === 1).length;
    const unpaidCount = filtered.filter((it) => Number(it.status) !== 1).length;
    return { total, paidCount, unpaidCount, count: filtered.length };
  }, [filtered]);

  const invalidRange = fromDate && toDate && new Date(fromDate) > new Date(toDate);

  // ====== Download helpers ======
  // 1) ใบเสร็จแบบ HTML -> Print to PDF (รองรับภาษาไทยสวย ๆ)
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
  body{ font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Thai", "Noto Sans", Arial, "Helvetica Neue", Helvetica, sans-serif; background:#fff; color:#111; padding:24px; }
  .wrap{ max-width:720px; margin:0 auto; border:1px solid #e5e7eb; border-radius:16px; padding:24px; }
  .brand{ display:flex; align-items:center; justify-content:space-between; }
  .brand h1{ margin:0; font-size:20px; }
  .badge{ display:inline-block; border-radius:999px; padding:6px 10px; font-size:12px; border:1px solid #10b981; color:#065f46; background:#ecfdf5; }
  .meta{ margin-top:16px; font-size:14px; color:#374151; }
  table{ width:100%; border-collapse:collapse; margin-top:16px; }
  th, td{ padding:12px; border-bottom:1px solid #e5e7eb; font-size:14px; text-align:left; }
  .right{ text-align:right; }
  .total{ font-weight:700; color:#065f46; }
  .footer{ margin-top:24px; font-size:12px; color:#6b7280; }
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
      <div>ผู้ใช้ (LINE ID): <span class="muted">${lineUserId}</span></div>
      <div>ที่อยู่ (ID): <span class="muted">${bill.address_id ?? "-"}</span></div>
      <div>วันครบกำหนด: <b>${formatDateTH(bill.due_date)}</b></div>
      <div>อัปเดตล่าสุด: ${formatDateTH(bill.updated_at)}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>รายการ</th>
          <th class="right">จำนวนเงิน (บาท)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>ค่าบริการเก็บขยะ</td>
          <td class="right">${formatTHB(bill.amount_due)}</td>
        </tr>
        <tr>
          <td class="total">รวมทั้งสิ้น</td>
          <td class="right total">${formatTHB(bill.amount_due)}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      * ใบเสร็จนี้สร้างจากระบบ SmartPayt ตามข้อมูลในประวัติการชำระเงิน
    </div>
  </div>

  <script>
    window.onload = () => {
      // เวลานิดหน่อยให้ฟอนต์โหลดก่อน
      setTimeout(() => {
        window.print();
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
    const header = ["bill_id", "address_id", "due_date", "amount_thb", "status"];
    const rows = filtered.map((b) => [
      b.id ?? "",
      b.address_id ?? "",
      formatDateTH(b.due_date),
      Number(b.amount_due || 0),
      Number(b.status) === 1 ? "PAID" : "UNPAID",
    ]);
    const csv = [header, ...rows].map((r) => r.map(String).map((s) => `"${s.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment_history_${fromDate}_to_${toDate}.csv`;
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

        {/* ฟิลเตอร์ช่วงเวลา */}
        <section className="rounded-2xl border border-emerald-100 bg-white/80 backdrop-blur p-4 md:p-5 shadow-sm mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <label className="w-12 text-sm md:text-base text-gray-600">จาก</label>
              <input
                type="date"
                className="border rounded-lg px-3 py-2 w-full text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-emerald-300"
                value={fromDate}
                max={toDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-12 text-sm md:text-base text-gray-600">ถึง</label>
              <input
                type="date"
                className="border rounded-lg px-3 py-2 w-full text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-emerald-300"
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button className="border px-3 py-2 rounded-lg flex-1 text-sm md:text-base hover:bg-emerald-50" onClick={() => quickSet(7)}>7 วัน</button>
              <button className="border px-3 py-2 rounded-lg flex-1 text-sm md:text-base hover:bg-emerald-50" onClick={() => quickSet(30)}>30 วัน</button>
              <button className="border px-3 py-2 rounded-lg flex-1 text-sm md:text-base hover:bg-emerald-50" onClick={setThisMonth}>เดือนนี้</button>
            </div>
          </div>
          {invalidRange && (
            <div className="mt-2 text-sm text-red-600">ช่วงวันที่ไม่ถูกต้อง: วันที่เริ่มมากกว่าวันที่สิ้นสุด</div>
          )}
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
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm text-gray-500">วันที่ครบกำหนด</div>
                          <div className="text-lg font-semibold">{formatDateTH(item.due_date)}</div>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          isPaid
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-amber-50 text-amber-700 border border-amber-100"
                        }`}>
                          {isPaid ? "ชำระแล้ว" : "ยังไม่ชำระ"}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-sm text-gray-500">จำนวนเงิน</div>
                        <div className="text-xl font-bold text-emerald-700">฿{formatTHB(item.amount_due)}</div>
                      </div>

                      {/* ปุ่มดาวน์โหลดใบเสร็จ */}
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => openReceiptWindow(item)}
                          className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
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
