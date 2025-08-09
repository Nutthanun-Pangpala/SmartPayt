import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const UserDetails = () => {
  const [user, setUser] = useState(null);
  const [userAddresses, setUserAddresses] = useState([]);
  const [billsMap, setBillsMap] = useState({});
  const [error, setError] = useState("");
  const { lineUserId } = useParams();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem("Admin_token");
        if (!token) {
          navigate("/adminlogin");
          return;
        }

        const response = await axios.get(
          `http://localhost:3000/admin/users/${lineUserId}`,
          {
            headers: {
              "Cache-Control": "no-cache",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response && response.data) {
          setUser(response.data.user || {});
        } else {
          setError("ไม่สามารถดึงข้อมูลผู้ใช้ได้");
        }
      } catch (error) {
        console.error("Error fetching user details:", error.message);
        setError("ไม่สามารถดึงข้อมูลผู้ใช้ได้");
      }
    };

    const fetchUserAddresses = async () => {
      try {
        const token = localStorage.getItem("Admin_token");
        if (!token) {
          navigate("/adminlogin");
          return;
        }
        const response = await axios.get(
          `http://localhost:3000/admin/users/address/${lineUserId}`,
          {
            headers: {
              "Cache-Control": "no-cache",
              authorization: `Bearer ${token}`,
            },
          }
        );
        const addresses = response.data.addresses;
        setUserAddresses(addresses);

        // โหลดบิลของทุกบ้านพร้อมกัน
        const billsData = await Promise.all(
          addresses.map(async (address) => {
            try {
              const res = await axios.get(
                `http://localhost:3000/admin/users/address/bills/${address.address_id}`,
                {
                  headers: {
                    "Cache-Control": "no-cache",
                    authorization: `Bearer ${token}`,
                  },
                }
              );
              const unpaidBills = res.data.bills.filter(
                (bill) => bill.status !== "ยังชำระแล้ว"
              ); // กรองบิลที่ยังไม่ชำระ
              // จัดเรียงบิลจากวันที่ครบกำหนดล่าสุดก่อน
              unpaidBills.sort(
                (a, b) => new Date(b.due_date) - new Date(a.due_date)
              );
              return { address_id: address.address_id, bills: unpaidBills };
            } catch (error) {
              console.error(
                `เกิดข้อผิดพลาดในการดึงบิลของบ้าน ${address.address_id}:`,
                error
              );
              return { address_id: address.address_id, bills: [] };
            }
          })
        );

        // อัปเดต billsMap
        const billsMapData = billsData.reduce((acc, { address_id, bills }) => {
          acc[address_id] = bills;
          return acc;
        }, {});

        setBillsMap(billsMapData);
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูลที่อยู่:", error);
        setError("ไม่สามารถดึงข้อมูลที่อยู่ได้");
      }
    };

    fetchUserDetails();
    fetchUserAddresses();
  }, [lineUserId, navigate]);

  const handleVerifyAddress = async (addressId) => {
    try {
      const token = localStorage.getItem("Admin_token");
      if (!token) {
        alert("กรุณาล็อกอินเพื่อดำเนินการต่อ");
        navigate("/adminlogin");
        return;
      }

      const response = await axios.patch(
        `http://localhost:3000/admin/${lineUserId}/address/verify/${addressId}`,
        {}, // Body ของ PATCH (ในกรณีนี้ไม่ต้องส่งข้อมูล)
        {
          headers: {
            "Cache-Control": "no-cache",
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && response.data.success) {
        setUserAddresses((prevAddresses) =>
          prevAddresses.map((address) =>
            address.address_id === addressId
              ? { ...address, address_verified: true }
              : address
          )
        );
      } else {
        setError(response.data.message || "เกิดข้อผิดพลาดในการยืนยันที่อยู่");
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการยืนยันที่อยู่:", error);
      setError("ไม่สามารถยืนยันที่อยู่ได้");
    }
  };

  const toggleExpand = (addressId) => {
    setExpanded((prevExpanded) => ({
      ...prevExpanded,
      [addressId]: !prevExpanded[addressId],
    }));
  };

  const handleAddAddress = () => {
    // ไปยังหน้าฟอร์มการเพิ่มที่อยู่
    navigate(`/admin/users/${lineUserId}/add-address`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="flex items-center justify-between p-4 bg-white shadow">
        <button
          onClick={() => navigate("/admin")}
          className="text-gray-800 p-2"
        >
          กลับไปยังหน้าหลัก
        </button>
        <h2 className="text-2xl font-bold text-gray-800">รายละเอียดผู้ใช้</h2>
      </div>

      <div className="flex-1 p-5">
        {error && <p className="text-red-500">{error}</p>}
        {user === null ? (
          <p>กำลังโหลดข้อมูล...</p>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold mb-4">ข้อมูลผู้ใช้</h3>
            <table className="table-auto w-full border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b">ชื่อ-นามสกุล</th>
                  <th className="px-4 py-2 border-b">ID Card No</th>
                  <th className="px-4 py-2 border-b">Phone No</th>
                  <th className="px-4 py-2 border-b">Email</th>
                  <th className="px-4 py-2 border-b">Line User ID</th>
                  <th className="px-4 py-2 border-b">วันที่สมัคร</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border-b">{user.name}</td>
                  <td className="px-4 py-2 border-b">{user.ID_card_No}</td>
                  <td className="px-4 py-2 border-b">{user.Phone_No}</td>
                  <td className="px-4 py-2 border-b">{user.Email}</td>
                  <td className="px-4 py-2 border-b">{user.lineUserId}</td>
                  <td className="px-4 py-2 border-b">{user.created_at}</td>
                </tr>
              </tbody>
            </table>

            <h3 className="text-2xl font-semibold mt-6 mb-4">
              ที่อยู่ของผู้ใช้
            </h3>
            {userAddresses &&
              userAddresses.map((address) => (
                <div
                  key={address.address_id}
                  className="border my-2 bg-white rounded-lg p-3"
                >
                  <div
                    onClick={() => toggleExpand(address.address_id)}
                    className="cursor-pointer"
                  >
                    <div className="flex">
                      <p className="mr-2">
                        <i className="fi fi-ss-house-building"></i> บ้านเลขที่:{" "}
                        {address.house_no}
                      </p>
                      <p>
                        <i className=""></i> หมู่ที่:{" "}
                        {address.village_no}
                        </p>
                        </div>
                      <p>
                        <i className="fi fi-ss-road"></i> ถนน/ซอย:{" "}
                        {address.Alley}
                      </p>
                 
                    <p>
                      <i className="fi fi-sr-marker"></i> อำเภอ/เขต:{" "}
                      {address.district}
                    </p>
                    <p>ตำบล/แขวง: {address.sub_district}</p>
                    <div className="flex">
                      <p
                        className={
                          address.address_verified
                            ? "text-green-500 "
                            : "text-red-500"
                        }
                      >
                        <i className="fi fi-sr-shield-trust"></i>{" "}
                        สถานะการยืนยันที่อยู่:{" "}
                        {address.address_verified
                          ? "ยืนยันแล้ว"
                          : "ยังไม่ยืนยัน"}
                      </p>
                      {!address.address_verified && (
                        <button
                          onClick={() =>
                            handleVerifyAddress(address.address_id)
                          }
                          className="ml-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                          ยืนยันที่อยู่
                        </button>
                      )}
                    </div>
                  </div>

                  {expanded[address.address_id] && (
                    <div className="mt-3">
                      <h2 className="text-md font-semibold">
                        📄 รายละเอียดบิล:
                      </h2>
                      {billsMap[address.address_id] &&
                      billsMap[address.address_id].length > 0 ? (
                        <table className="table-auto w-full border-collapse">
                          <thead>
                            <tr>
                              <th className="px-4 py-2 border-b">จำนวนเงิน</th>
                              <th className="px-4 py-2 border-b">
                                วันที่ครบกำหนด
                              </th>
                              <th className="px-4 py-2 border-b">สถานะ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {billsMap[address.address_id] &&
                              billsMap[address.address_id].map(
                                (bill, index) => (
                                  <tr key={index}>
                                    <td className="px-4 py-2 border-b">
                                      {bill.amount_due} บาท
                                    </td>
                                    <td className="px-4 py-2 border-b">
                                      {bill.due_date
                                        ? new Date(
                                            bill.due_date
                                          ).toLocaleDateString()
                                        : "ไม่ระบุ"}
                                    </td>
                                    <td
                                      className={
                                        bill.status
                                          ? "px-4 py-2 border-b text-green-500"
                                          : "px-4 py-2 border-b text-red-500"
                                      }
                                    >
                                      {bill.status ? "ชำระแล้ว" : "ยังไม่ชำระ"}
                                    </td>
                                  </tr>
                                )
                              )}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-gray-500">ไม่มีบิลที่ต้องชำระ</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            <div className="mt-6">
              <button
                onClick={handleAddAddress}
                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
              >
                เพิ่มที่อยู่
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetails;
