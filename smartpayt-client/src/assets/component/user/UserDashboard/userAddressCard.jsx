import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GenerateBarcode from "./GenerateBarcode";

const formatBaht = (num) => {
  const n = Number(num || 0);
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDateTH = (dateStr) => {
  if (!dateStr) return "ไม่ระบุ";
  const d = new Date(dateStr);
  if (isNaN(d)) return "ไม่ระบุ";
  return d.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const StatusBadge = ({ verified }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium
      ${verified ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
  >
    <i className={`fi ${verified ? "fi-sr-shield-check" : "fi-sr-shield-exclamation"}`} />
    {verified ? "ยืนยันแล้ว" : "ยังไม่ยืนยัน"}
  </span>
);

const Chevron = ({ open }) => (
  <svg
    className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 011.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

const UserAddressesCard = () => {
  const [userAddresses, setUserAddresses] = useState([]);
  const [billsMap, setBillsMap] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const lineUserId = useMemo(() => localStorage.getItem("lineUserId"), []);

  useEffect(() => {
    if (!lineUserId) {
      setError("ไม่พบข้อมูลการเข้าสู่ระบบ");
      return;
    }

    const fetchUserAddresses = async () => {
      setLoading(true);
      setError("");
      try {
        // ดึงที่อยู่
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/address/${lineUserId}`
        );
        const addresses = response.data?.addresses || [];
        setUserAddresses(addresses);

        // ดึงบิลสำหรับที่อยู่ที่ยืนยันแล้วเท่านั้น
        const billsData = await Promise.all(
          addresses.map(async (address) => {
            if (!address.address_verified) {
              return { address_id: address.address_id, bills: [] };
            }
            try {
              const res = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/api/bills/${address.address_id}`
              );
              // เก็บเฉพาะบิลที่ยังไม่ชำระ (0) / รอตรวจสอบ (2)
              const unpaid = (res.data?.bills || []).filter(
                (b) => String(b.status) === "0" || String(b.status) === "2"
              );
              return { address_id: address.address_id, bills: unpaid };
            } catch (e) {
              console.error(`Error fetching bills for ${address.address_id}:`, e);
              return { address_id: address.address_id, bills: [] };
            }
          })
        );

        const map = billsData.reduce((acc, { address_id, bills }) => {
          acc[address_id] = bills;
          return acc;
        }, {});
        setBillsMap(map);
      } catch (e) {
        console.error("Error fetching addresses:", e);
        setError("ไม่สามารถดึงข้อมูลที่อยู่ได้");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAddresses();
  }, [lineUserId]);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg md:text-xl font-bold">ที่อยู่ของคุณ</h1>
        {loading && <span className="text-sm text-gray-500">กำลังโหลด...</span>}
      </div>

      {userAddresses.length === 0 && !loading ? (
        <div className="rounded-xl border p-6 text-center text-gray-500">
          ยังไม่มีที่อยู่ในระบบ
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userAddresses.map((address) => {
            const id = address.address_id;
            const bills = billsMap[id] || [];
            const totalAmount = bills.reduce((sum, b) => {
              const n = Number(b.amount_due);
              return !isNaN(n) && n > 0 ? sum + n : sum;
            }, 0);

            const open = !!expanded[id];
            const verified = !!address.address_verified;

            return (
              <div
                key={id}
                className="rounded-2xl border shadow-sm bg-white overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-2 text-base font-semibold">
                          <i className="fi fi-ss-house-building" />
                          บ้านเลขที่: {address.house_no || "-"}
                        </span>
                        <StatusBadge verified={verified} />
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        หมู่ที่ {address.village_no ?? "-"} • {address.Alley || "-"}
                      </div>
                      <div className="text-sm text-gray-600">
                        ต.{address.sub_district || "-"} อ.{address.district || "-"} จ.{address.province || "-"} {address.postal_code || ""}
                      </div>
                    </div>

                    {/* Barcode (เฉพาะที่ยืนยันแล้ว) */}
                    {verified && (
                      <div className="shrink-0">
                        <GenerateBarcode
                          addressId={String(id)}
                          status={verified}
                          addressInfo={address}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary / Controls */}
                <div className="p-4">
                  {verified ? (
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center rounded-lg bg-red-50 text-red-700 px-3 py-1 text-sm font-medium">
                          <i className="fi fi-sr-baht-sign mr-1" />
                          ยอดรวมค่าบิล: {formatBaht(totalAmount)} บาท
                        </span>
                        <span className="text-xs text-gray-500">
                          จำนวนบิล {bills.length} รายการ
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleExpand(id)}
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                      >
                        ดูรายละเอียด
                        <Chevron open={open} />
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-yellow-50 text-yellow-800 text-sm px-3 py-2">
                      <i className="fi fi-sr-info mr-1" />
                      ที่อยู่นี้ยังไม่ผ่านการยืนยัน กรุณาติดต่อเทศบาลเพื่อยืนยันก่อน
                    </div>
                  )}

                  {/* Expanded Bills */}
                  {verified && open && (
                    <div className="mt-3 space-y-2">
                      <h3 className="text-sm font-semibold">📄 รายละเอียดบิล</h3>

                      {bills.length > 0 ? (
                        <>
                          {bills
                            .slice()
                            .sort((a, b) => new Date(b.due_date) - new Date(a.due_date))
                            .map((bill, idx) => {
                              const isPending = String(bill.status) === "2";
                              return (
                                <div
                                  key={idx}
                                  className="rounded-lg border bg-gray-50 p-3"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="text-sm">
                                      <div>จำนวนเงิน: <b>{formatBaht(bill.amount_due)}</b> บาท</div>
                                      <div className="text-gray-600">
                                        ครบกำหนด: {formatDateTH(bill.due_date)}
                                      </div>
                                    </div>
                                    <span
                                      className={`text-xs font-medium rounded-full px-2.5 py-1
                                        ${isPending ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-700"}`}
                                    >
                                      {isPending ? "รอตรวจสอบ" : "ยังไม่ชำระ"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}

                          {/* Pay button: แสดงเมื่อมีบิลยังไม่ชำระ (status === 0) */}
                          {bills.some((b) => String(b.status) === "0") && (
                            <div className="pt-2 text-center">
                              <button
                                onClick={() =>
                                  navigate("/payment/", {
                                    state: {
                                      bills,
                                      addressId: id,
                                      totalAmount,
                                    },
                                  })
                                }
                                type="button"
                                className="inline-flex items-center gap-2 rounded-full bg-green-600 hover:bg-green-700 text-white px-6 py-2 text-sm font-medium"
                              >
                                <i className="fi fi-sr-credit-card" />
                                ชำระค่าบริการ
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">ไม่มีบิลที่ต้องชำระ</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserAddressesCard;
