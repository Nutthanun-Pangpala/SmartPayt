import axios from "axios";
import { useEffect, useState } from "react";
import NavbarComponent from "../assets/component/user/userNavbar";
import BottomNav from "../assets/component/user/userNavigate";

export default function AccountManagement() {
  const [account, setAccount] = useState(null); // สมมติได้ข้อมูลแค่ user เดียว
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    ID_card_No: "",
    Phone_No: "",
    Email: "",
  });

  useEffect(() => {
    const lineUserId = localStorage.getItem("lineUserId");
    if (!lineUserId) return;

    axios
      .get(`http://localhost:3000/api/user/${lineUserId}`)
      .then((res) => {
        // สมมติ API ส่งกลับข้อมูล user ตรง ๆ
        setAccount(res.data.user || res.data);
        setFormData(res.data.user || res.data);
      })
      .catch((err) => {
        console.error("Error fetching user:", err);
      });
  }, []);

  const startEdit = () => {
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setFormData(account);
  };

  const saveEdit = () => {
    axios
      .put(
        `http://localhost:3000/api/userupdateAccout/${formData.lineUserId}`,
        formData
      )
      .then(() => {
        setAccount(formData);
        setEditing(false);
        alert("แก้ไขข้อมูลสำเร็จ");
      })
      .catch((err) => {
        console.error("Error updating account:", err);
        alert("แก้ไขข้อมูลไม่สำเร็จ");
      });
  };

  if (!account) return <div>กำลังโหลดข้อมูล...</div>;

  return (
    <div>
      <NavbarComponent />
      <div>
        <div className="font-bold w-full h-20 text-center p-10">
          จัดการบัญชีผู้ใช้
        </div>
        <div className="h-auto border-b bg-slate-100 flex justify-center ">
          <div className="w-auto px-20 py-10 border bg-white my-5 rounded-lg">
            {/* ชื่อ */}
            <h1 className="mr-5">ชื่อ</h1>
            <div className="w-fit h-10 m-2 p-2  ">
              {editing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-slate-100 w-fit h-10 border rounded-md p-2"
                />
              ) : (
                account.name
              )}
            </div>

            {/* เลขบัตรประชาชน */}
            <h1 className="mr-5">รหัสประจำตัวประชาชน</h1>
            <div className="w-fit h-10 m-2 p-2 ">
              {editing ? (
                <input
                  type="text"
                  value={formData.ID_card_No}
                  onChange={(e) =>
                    setFormData({ ...formData, ID_card_No: e.target.value })
                  }
                  className="bg-slate-100 w-fit h-10 border rounded-md p-2 "
                />
              ) : (
                account.ID_card_No
              )}
            </div>

            {/* เบอร์โทรศัพท์ */}
            <h1 className="mr-5">เบอร์โทรศัพท์</h1>
            <div className="w-fit h-10 m-2 p-2 ">
              {editing ? (
                <input
                  type="text"
                  value={formData.Phone_No}
                  onChange={(e) =>
                    setFormData({ ...formData, Phone_No: e.target.value })
                  }
                  className="bg-slate-100 w-fit h-10 border rounded-md p-2 "
                />
              ) : (
                account.Phone_No
              )}
            </div>

            {/* อีเมล */}
            <h1 className="mr-5">อีเมล</h1>
            <div className="w-fit h-10 m-2 p-2 ">
              {editing ? (
                <input
                  type="email"
                  value={formData.Email}
                  onChange={(e) =>
                    setFormData({ ...formData, Email: e.target.value })
                  }
                  className="bg-slate-100 w-fit h-10 border rounded-md p-2 "
                />
              ) : (
                account.Email
              )}
            </div>

            {/* จัดการ */}
            <div className="w-1/5 px-2 flex space-x-2">
              {editing ? (
                <>
                  <button
                    onClick={saveEdit}
                    className="bg-green-500 text-white px-3 py-1 rounded m-2"
                  >
                    <i className="mr-2 fi fi-br-check"></i>บันทึก
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="bg-gray-300 px-3 py-1 rounded m-2"
                  >
                    ยกเลิก
                  </button>
                </>
              ) : (
                <button
                  onClick={startEdit}
                  className="bg-blue-500 text-white px-3 py-1 m-2 rounded flex"
                >
                  <i className="fi fi-rr-pencil mr-2"></i>แก้ไข
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <BottomNav/>
    </div>
  );
}
