import axios from "axios";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { useParams } from "react-router-dom";
import NavbarComponent from "../assets/component/user/userNavbar";
import BottomNav from "../assets/component/user/userNavigate";

ChartJS.register(ArcElement, Tooltip, Legend);

const TYPE_KEYS = ["ขยะทั่วไป", "ขยะอันตราย", "ขยะรีไซเคิล", "ขยะอินทรีย์"];
const COLORS = {
  bg: ["#4F46E5", "#EF4444", "#10B981", "#F59E0B"],
  bd: ["#3730A3", "#B91C1C", "#047857", "#D97706"],
};

export default function WastePieMulti() {
  const { lineUserId } = useParams();

  const [from, setFrom] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [to, setTo]     = useState(dayjs().endOf("month").format("YYYY-MM-DD"));

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [addresses, setAddresses] = useState([]); // [id,...]
  const [overall, setOverall]     = useState({});
  const [byAddress, setByAddress] = useState({});

  const [addrFilter, setAddrFilter] = useState("ALL");

  const quickSet = (days) => {
    setFrom(dayjs().subtract(days - 1, "day").format("YYYY-MM-DD"));
    setTo(dayjs().format("YYYY-MM-DD"));
  };

  const isAllZero = (obj) => TYPE_KEYS.every((k) => Number(obj?.[k] || 0) === 0);

  const fetchData = useCallback(async () => {
    if (!lineUserId) return;
    setLoading(true);
    setError("");
    try {
      const url = `http://localhost:3000/api/user-waste-summary/${encodeURIComponent(lineUserId)}`;
      const res = await axios.get(url, { params: { from, to } });

      const serverIds = (res.data?.addresses || []).map(String);
      setAddresses(serverIds);
      setOverall(res.data?.overall || {});
      setByAddress(res.data?.byAddress || {});
      setAddrFilter((prev) => (prev !== "ALL" && !serverIds.includes(prev) ? "ALL" : prev));
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [lineUserId, from, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sourceForView = useMemo(
    () => (addrFilter === "ALL" ? overall : (byAddress[addrFilter] || {})),
    [addrFilter, overall, byAddress]
  );

  const doughnutData = useMemo(() => {
    const vals = TYPE_KEYS.map((k) => Number(sourceForView[k] || 0));
    return {
      labels: TYPE_KEYS,
      datasets: [{
        label: "กก.",
        data: vals,
        backgroundColor: COLORS.bg,
        borderColor: COLORS.bd,
        borderWidth: 2,
      }],
    };
  }, [sourceForView]);

  const cards = useMemo(() => {
    const list = TYPE_KEYS.map((k, i) => ({
      label: k,
      value: Number(sourceForView[k] || 0),
      color: COLORS.bg[i],
      border: COLORS.bd[i],
    }));
    const total = list.reduce((s, v) => s + v.value, 0);
    return { items: list.sort((a, b) => b.value - a.value), total };
  }, [sourceForView]);

  const titleSuffix = addrFilter === "ALL" ? "(รวมทุกบ้าน)" : `(บ้าน #${addrFilter})`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <NavbarComponent/>

      {/* Page container + กันชน BottomNav */}
      <div
        className="mx-auto w-full max-w-screen-sm md:max-w-3xl px-4 md:px-6 py-5 pb-28"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 7rem)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
            สัดส่วนการทิ้งขยะ <span className="text-emerald-600">{titleSuffix}</span>
          </h1>

          {/* ปุ่มรีเฟรชเล็ก ๆ */}
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-sm hover:bg-emerald-50 transition"
          >
            <i className="fi fi-rr-rotate-right" />
            โหลดซ้ำ
          </button>
        </div>

        {/* ฟิลเตอร์ */}
        <div className="rounded-2xl border border-gray-100 bg-white/70 backdrop-blur-sm shadow-sm p-3 md:p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <label className="w-12 text-sm md:text-base text-gray-600">จาก</label>
              <input
                type="date"
                className="border rounded-lg px-3 py-2 w-full text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-emerald-200"
                value={from}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-12 text-sm md:text-base text-gray-600">ถึง</label>
              <input
                type="date"
                className="border rounded-lg px-3 py-2 w-full text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-emerald-200"
                value={to}
                min={from}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap md:flex-nowrap gap-2">
              <button
                className="border px-3 py-2 rounded-lg flex-1 text-sm md:text-base hover:bg-gray-50"
                onClick={() => quickSet(7)}
              >
                7 วัน
              </button>
              <button
                className="border px-3 py-2 rounded-lg flex-1 text-sm md:text-base hover:bg-gray-50"
                onClick={() => quickSet(30)}
              >
                30 วัน
              </button>
              <button
                className="border px-3 py-2 rounded-lg flex-1 text-sm md:text-base hover:bg-gray-50"
                onClick={() => {
                  setFrom(dayjs().startOf("month").format("YYYY-MM-DD"));
                  setTo(dayjs().endOf("month").format("YYYY-MM-DD"));
                }}
              >
                เดือนนี้
              </button>
            </div>
          </div>

          {/* ฟิลเตอร์บ้าน */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-500 shrink-0">บ้าน</span>
            <select
              className="border rounded-lg px-3 py-2 w-full text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-emerald-200"
              value={addrFilter}
              onChange={(e) => setAddrFilter(e.target.value)}
            >
              <option value="ALL">รวมทุกบ้าน</option>
              {addresses.map((id) => (
                <option key={id} value={id}>บ้าน #{id}</option>
              ))}
            </select>
          </div>
        </div>

        {/* กล่องแจ้ง Error */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 flex items-start gap-2">
            <i className="fi fi-rr-triangle-warning mt-0.5" />
            <div className="text-sm">
              {error}
              <div className="mt-1">
                <button
                  onClick={fetchData}
                  className="underline underline-offset-4 hover:text-red-800"
                >
                  ลองอีกครั้ง
                </button>
              </div>
            </div>
          </div>
        )}

        {/* สรุปช่วงวันที่ */}
        <div className="text-xs md:text-sm text-gray-500 mb-2">
          ช่วงวันที่ {dayjs(from).format("DD/MM/YYYY")} - {dayjs(to).format("DD/MM/YYYY")}
        </div>

        {/* การ์ดกราฟโดนัท */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 md:p-5">
          {loading ? (
            // Skeleton โหลด
            <div className="animate-pulse">
              <div className="h-6 w-1/3 bg-gray-200 rounded mb-4" />
              <div className="h-[240px] sm:h-[280px] md:h-[340px] lg:h-[380px] bg-gray-100 rounded-xl" />
            </div>
          ) : (
            <>
              <div className="relative h-[240px] sm:h-[280px] md:h-[340px] lg:h-[380px]">
                {!error && isAllZero(sourceForView) && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <div className="text-sm md:text-base text-gray-500">
                      ยังไม่มีข้อมูลในช่วงที่เลือก
                    </div>
                  </div>
                )}
                <Doughnut
                  data={doughnutData}
                  options={{
                    plugins: {
                      legend: { position: "bottom", labels: { boxWidth: 14, font: { size: 12 } } },
                      tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed} กก.` } },
                    },
                    cutout: "60%",
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* การ์ดสรุป: มือถือ 1 คอลัมน์ / ≥sm 2 คอลัมน์ */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cards.items.map((it) => (
            <div
              key={it.label}
              className="flex items-center justify-between rounded-xl border border-gray-100 bg-white shadow-sm p-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full ring-2"
                  style={{ backgroundColor: it.color, boxShadow: `0 0 0 2px ${it.border}` }}
                />
                <span className="font-medium text-sm md:text-base">{it.label}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-sm md:text-base">{it.value.toFixed(2)} กก.</div>
                <div className="text-[11px] md:text-xs text-gray-500">
                  {cards.total ? ((it.value * 100) / cards.total).toFixed(1) : "0.0"}%
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 p-3">
            <span className="font-medium text-sm md:text-base text-emerald-900">รวม</span>
            <span className="font-semibold text-sm md:text-base text-emerald-900">
              {cards.total.toFixed(2)} กก.
            </span>
          </div>
        </div>

        {/* spacer กันโดน BottomNav บัง */}
        <div className="h-24 sm:h-20" aria-hidden />
      </div>

      <BottomNav/>
    </div>
  );
}
