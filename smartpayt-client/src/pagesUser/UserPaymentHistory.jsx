import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import NavbarComponent from "../assets/component/user/userNavbar";
import BottomNav from "../assets/component/user/userNavigate";

export default function PaymentHistory() {
  const { lineUserId } = useParams();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (lineUserId) {
      axios
        .get(`http://localhost:3000/api/payment-history/${lineUserId}`)
        .then((res) => setHistory(res.data))
        .catch((err) => console.error(err));
    }
  }, [lineUserId]);

  return (
    <div>
      <NavbarComponent />
      <h2 className=" text-center mt-10  font-extrabold">ประวัติการชำระเงิน</h2>
      <ul className="p-10 " >
        {history.map((item) => (
          <li key={item.id} className="bg-slate-200 m-2 p-8 rounded-xl">
            วันที่:{" "}
            {item.due_date
              ? new Date(item.due_date).toLocaleDateString("th-TH", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "ไม่ระบุ"}
            , จำนวน: {item.amount_due} บาท, สถานะ:{" "}
            {item.status === 1 ? "ชำระแล้ว" : "ยังไม่ชำระ"}
          </li>
        ))}
      </ul>
      <BottomNav />
    </div>
  );
}
