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
  const todayISO = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const startOfMonthISO = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  )
    .toISOString()
    .slice(0, 10);

  const [fromDate, setFromDate] = useState(startOfMonthISO);
  const [toDate, setToDate] = useState(todayISO);

  // === โหลดข้อมูล ===
  useEffect(() => {
    if (!lineUserId) return;
    setLoading(true);
    axios
      .get(`http://localhost:3000/api/payment-history/${lineUserId}`)
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

  // === Utils ===
  const formatDateTH = (d) =>
    d
      ? new Date(d).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "ไม่ระบุ";

  const formatTHB = (n) =>
    isNaN(Number(n)) ? "฿0.00" : Number(n).toLocaleString("th-TH", { minimumFractionDigits: 2 });

  const inRange = (dateStr, fromStr, toStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const f = fromStr ? new Date(fromStr) : null;
    const t = toStr ? new Date(toStr) : null;
    d.setHours(0, 0, 0, 0);
    if (f) f.setHours(0, 0, 0, 0);
    if (t) t.setHours(0, 0, 0, 0);
    const afterFrom = f ? d >= f : true;
    const beforeTo = t ? d <= t : true;
    return afterFrom && beforeTo;
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

  const invalidRange =
    fromDate && toDate && new Date(fromDate) > new Date(toDate);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <NavbarComponent />

      {/* เนื้อหา */}
      <main
        className="mx-auto w-full max-w-screen-sm md:max-w-2xl px-4 md:px-6 pt-5 pb-28"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 7rem)" }}
      >
        <h1 className="text-center text-2xl md:text-3xl font-bold tracking-wide text-black mb-4">
          ประวัติการชำระเงิน
        </h1>

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
              <button
                className="border px-3 py-2 rounded-lg flex-1 text-sm md:text-base hover:bg-emerald-50"
                onClick={() => quickSet(7)}
              >
                7 วัน
              </button>
              <button
                className="border px-3 py-2 rounded-lg flex-1 text-sm md:text-base hover:bg-emerald-50"
                onClick={() => quickSet(30)}
              >
                30 วัน
              </button>
              <button
                className="border px-3 py-2 rounded-lg flex-1 text-sm md:text-base hover:bg-emerald-50"
                onClick={setThisMonth}
              >
                เดือนนี้
              </button>
            </div>
          </div>

          {invalidRange && (
            <div className="mt-2 text-sm text-red-600">
              ช่วงวันที่ไม่ถูกต้อง: วันที่เริ่มมากกว่าวันที่สิ้นสุด
            </div>
          )}
        </section>

        {/* การ์ดสรุปยอด */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-xs text-gray-500">ยอดรวม</div>
            <div className="text-xl font-semibold text-emerald-700">
              ฿{formatTHB(summary.total)}
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-xs text-gray-500">รายการทั้งหมด</div>
            <div className="text-xl font-semibold">{summary.count} รายการ</div>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">สถานะ</div>
              <div className="text-sm mt-1">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  ชำระแล้ว: {summary.paidCount}
                </span>
              </div>
              <div className="text-sm">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                  ยังไม่ชำระ: {summary.unpaidCount}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* รายการ */}
        <section>
          {loading ? (
            // Skeleton loading
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
            <div className="text-center text-gray-500">
              ยังไม่มีรายการในช่วงที่เลือก
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.due_date || b.created_at || 0) -
                    new Date(a.due_date || a.created_at || 0)
                )
                .map((item) => {
                  const isPaid = Number(item.status) === 1;
                  return (
                    <li
                      key={item.id}
                      className="bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm text-gray-500">
                            วันที่ครบกำหนด
                          </div>
                          <div className="text-lg font-semibold">
                            {formatDateTH(item.due_date)}
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            isPaid
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}
                        >
                          {isPaid ? "ชำระแล้ว" : "ยังไม่ชำระ"}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-sm text-gray-500">จำนวนเงิน</div>
                        <div className="text-xl font-bold text-emerald-700">
                          ฿{formatTHB(item.amount_due)}
                        </div>
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
