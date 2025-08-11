import axios from "axios";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    if (!lineUserId) return;
    let cancel = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const url = `http://localhost:3000/api/user-waste-summary/${encodeURIComponent(lineUserId)}`;
        const res = await axios.get(url, { params: { from, to } });
        if (cancel) return;

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
    })();

    return () => { cancel = true; };
  }, [lineUserId, from, to]);

  const sourceForView = useMemo(() => (
    addrFilter === "ALL" ? overall : (byAddress[addrFilter] || {})
  ), [addrFilter, overall, byAddress]);

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
    <div>
      <NavbarComponent/>

      {/* เพิ่ม pb-24 กันโดน BottomNav บัง + เผื่อ safe-area iOS */}
      <div
        className="mx-auto w-full max-w-screen-sm md:max-w-3xl px-4 md:px-6 py-4 pb-24"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 6rem)" }}
      >
        <h1 className="text-xl md:text-2xl font-semibold mb-3">
          สัดส่วนการทิ้งขยะ {titleSuffix}
        </h1>

        {/* ฟิลเตอร์ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="flex items-center gap-2">
            <label className="w-12 text-sm md:text-base">จาก</label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 w-full text-sm md:text-base"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="w-12 text-sm md:text-base">ถึง</label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 w-full text-sm md:text-base"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap md:flex-nowrap gap-2">
            <button className="border px-3 py-2 rounded-lg flex-1 text-sm md:text-base" onClick={() => quickSet(7)}>7 วัน</button>
            <button className="border px-3 py-2 rounded-lg flex-1 text-sm md:text-base" onClick={() => quickSet(30)}>30 วัน</button>
            <button
              className="border px-3 py-2 rounded-lg flex-1 text-sm md:text-base"
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
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-500 shrink-0">บ้าน</span>
          <select
            className="border rounded-lg px-3 py-2 w-full text-sm md:text-base"
            value={addrFilter}
            onChange={(e) => setAddrFilter(e.target.value)}
          >
            <option value="ALL">รวมทุกบ้าน</option>
            {addresses.map((id) => (
              <option key={id} value={id}>บ้าน #{id}</option>
            ))}
          </select>
        </div>

        {/* กราฟโดนัท */}
        <div className="rounded-2xl border p-4">
          <div className="text-xs md:text-sm text-gray-500 mb-3">
            ช่วงวันที่ {dayjs(from).format("DD/MM/YYYY")} - {dayjs(to).format("DD/MM/YYYY")}
          </div>

          {loading ? (
            <div className="text-gray-500">กำลังโหลด...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <div className="h-[240px] sm:h-[280px] md:h-[340px] lg:h-[380px]">
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
          )}
        </div>

        {/* การ์ดสรุป: มือถือ 1 คอลัมน์ / ≥sm เป็น 2 คอลัมน์ */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cards.items.map((it) => (
            <div key={it.label} className="flex items-center justify-between rounded-xl border p-3">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: it.color, border: `2px solid ${it.border}` }}
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

          <div className="flex items-center justify-between rounded-xl border p-3 bg-gray-50">
            <span className="font-medium text-sm md:text-base">รวม</span>
            <span className="font-semibold text-sm md:text-base">{cards.total.toFixed(2)} กก.</span>
          </div>
        </div>

        {/* spacer กันโดน BottomNav บัง (เสริมความชัวร์) */}
        <div className="h-24 sm:h-20" aria-hidden />
      </div>

      <BottomNav/>
    </div>
  );
}
