import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GenerateBarcode from "./GenerateBarcode";

const UserAddressesCard = () => {
  const [userAddresses, setUserAddresses] = useState([]);
  const [billsMap, setBillsMap] = useState({});
  const [expanded, setExpanded] = useState({});
  const [error, setError] = useState("");
  const navigate = useNavigate(); 

  const lineUserId = localStorage.getItem("lineUserId");

  useEffect(() => {
    if (!lineUserId) {
      setError("ไม่พบข้อมูลการเข้าสู่ระบบ");
      return;
    }

    const fetchUserAddresses = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/address/${lineUserId}`
        );
        const addresses = response.data.addresses;
        setUserAddresses(addresses);

        const billsData = await Promise.all(
          addresses.map(async (address) => {
            if (!address.address_verified) {
              return { address_id: address.address_id, bills: [] }; // ไม่ดึงบิลถ้า address_verified = 0
            }
            try {
              const res = await axios.get(
                `http://localhost:3000/api/bills/${address.address_id}`
              );
              const unpaidBills = res.data.bills.filter(
                (bill) => bill.status !== "1"
              );
              return { address_id: address.address_id, bills: unpaidBills };
            } catch (error) {
              console.error(
                `Error fetching bills for ${address.address_id}:`,
                error
              );
              return { address_id: address.address_id, bills: [] };
            }
          })
        );

        const billsMapData = billsData.reduce((acc, { address_id, bills }) => {
          acc[address_id] = bills;
          return acc;
        }, {});

        setBillsMap(billsMapData);
      } catch (error) {
        console.error("Error fetching addresses:", error);
        setError("ไม่สามารถดึงข้อมูลที่อยู่ได้");
      }
    };

    fetchUserAddresses();
  }, [lineUserId]);

  const toggleExpand = (address_id) => {
    setExpanded((prev) => ({
      ...prev,
      [address_id]: !prev[address_id],
    }));
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="AddressCard p-4 rounded-lg max-h-full">
      <h1 className="text-lg font-bold">ที่อยู่ของคุณ</h1>
      {userAddresses.map((address) => {
        const totalAmount = Array.isArray(billsMap[address.address_id])
          ? billsMap[address.address_id].reduce((sum, bill) => {
              const amountDue = Number(bill.amount_due);
              return !isNaN(amountDue) && amountDue > 0 ? sum + amountDue : sum;
            }, 0)
          : 0;
        const formattedTotal = totalAmount.toFixed(2);

        return (
          <div
            key={address.address_id}
            className="border my-2 bg-white rounded-lg p-3"
          >
            <div
              onClick={
                address.address_verified
                  ? () => toggleExpand(address.address_id)
                  : null
              }
              className={`cursor-pointer ${
                !address.address_verified ? "pointer-events-none " : ""
              }`}
            >
              <div className="flex">
                <p className="mr-2">
                  <i className="fi fi-ss-house-building"></i> บ้านเลขที่:{" "}
                  {address.house_no}
                </p>
                <p>
                  <i className="fi fi-ss-road"></i> ถนน/ซอย: {address.Alley}
                </p>
              </div>
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
                  {address.address_id && !address.address_verified && (
                <ol className="flex items-center py-3 w-full ml-10">
                  <li className="flex w-full items-center text-green-600 dark:text-green-500 after:content-[''] after:w-full after:h-1 after:border-b after:border-green-100 after:border-4 after:inline-block dark:after:border-green-700">
                  <span className="flex items-center justify-center w-10 h-10 bg-green-300 rounded-full lg:h-12 lg:w-12 dark:bg-green-700 shrink-0">
                      <svg
                        className="w-3.5 h-3.5 text-green-600 lg:w-4 lg:h-4 dark:text-white"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 16 12"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M1 5.917 5.724 10.5 15 1.5"
                        />
                      </svg>
                    </span>
                  </li>
                  <li className="flex w-full items-center after:content-[''] after:w-full after:h-1 after:border-b after:border-green-100 after:border-4 after:inline-block dark:after:border-green-300">
                    <div>
                  <span className="flex items-center justify-center w-10 h-10 bg-green-300 rounded-full lg:h-12 lg:w-12 dark:bg-green-400 shrink-0">
                      <svg
                        className="w-4 h-4 text-green-300 lg:w-5 lg:h-5 dark:text-white"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 16"
                      >
                        <path d="M18 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2ZM6.5 3a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3.014 13.021l.157-.625A3.427 3.427 0 0 1 6.5 9.571a3.426 3.426 0 0 1 3.322 2.805l.159.622-6.967.023ZM16 12h-3a1 1 0 0 1 0-2h3a1 1 0 0 1 0 2Zm0-3h-3a1 1 0 1 1 0-2h3a1 1 0 1 1 0 2Zm0-3h-3a1 1 0 1 1 0-2h3a1 1 0 1 1 0 2Z" />
                      </svg>
                    </span>
                    </div>
                  </li>
                  <li className="flex items-center w-full">
                    <span className="flex items-center justify-center w-10 h-10 bg-green-300 rounded-full lg:h-12 lg:w-12 dark:bg-green-400 shrink-0">
                      <svg
                        className="w-4 h-4 text-green-300 lg:w-5 lg:h-5 dark:text-white"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 18 20"
                      >
                        <path d="M16 1h-3.278A1.992 1.992 0 0 0 11 0H7a1.993 1.993 0 0 0-1.722 1H2a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2ZM7 2h4v3H7V2Zm5.7 8.289-3.975 3.857a1 1 0 0 1-1.393 0L5.3 12.182a1.002 1.002 0 1 1 1.4-1.436l1.328 1.289 3.28-3.181a1 1 0 1 1 1.392 1.435Z" />
                      </svg>
                    </span>
                  </li>
                </ol>
                
              )}
                  <i className="fi fi-sr-shield-trust"></i>{" "}
                  สถานะการยืนยันที่อยู่:{" "}
                  {address.address_verified
                    ? "ยืนยันแล้ว "
                    : "กรุณาติดต่อที่เทศบาล "}
                </p>
              </div>
              
              {/* แสดงยอดรวมค่าบิลเฉพาะที่อยู่ที่ยืนยันแล้ว */}
              {address.address_verified ? (
                <div className="flex justify-between">
                  <p className="font-bold text-red-600">
                    <i className="fi fi-sr-baht-sign"></i> ยอดรวมค่าบิล:{" "}
                    {formattedTotal} บาท
                  </p>
                  <GenerateBarcode
                    addressId={String(address.address_id)}
                    status={address.address_verified}
                  />
                </div>
              ) : null}
            </div>

            {expanded[address.address_id] && address.address_verified && (
            <div className="mt-3">
              <h2 className="text-md font-semibold">📄 รายละเอียดบิล:</h2>
              {billsMap[address.address_id]?.length > 0 ? (
                <>
                  {billsMap[address.address_id]
                    .sort((a, b) => new Date(b.due_date) - new Date(a.due_date))
                    .map((bill, index) => (
                      <div
                        key={index}
                        className="mt-2 p-2 border bg-gray-100 rounded-md"
                      >
                        <p>💰 จำนวนเงิน: {bill.amount_due} บาท</p>
                        <p>
                          ⏳ วันที่ครบกำหนด:{" "}
                          {bill.due_date
                            ? new Date(bill.due_date).toLocaleDateString("th-TH", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })
                            : "ไม่ระบุ"}
                        </p>
                        <p
                          className={
                            bill.status ? "text-green-500" : "text-red-500"
                          }
                        >
                          สถานะ : {bill.status ? "ชำระแล้ว" : "ยังไม่ชำระ"}
                        </p>
                      </div>
                    ))}

                  {/* ✅ แสดงปุ่มเฉพาะเมื่อมีบิลที่ยังไม่ชำระ */}
                  {billsMap[address.address_id].some(bill => bill.status !== "1") && (
                    <div className="flex justify-center my-3">
                      <button
                        onClick={() =>
                          navigate("/payment", {
                            state: {
                              bills: billsMap[address.address_id],
                              addressId: address.address_id,
                              totalAmount,
                            },
                          })
                        }
                        type="button"
                        className="text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center"
                      >
                        ชำระค่าบริการ
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500">ไม่มีบิลที่ต้องชำระ</p>
              )}
            </div>
          )}
          </div>
        );
      })}
    </div>
  );
};

export default UserAddressesCard;
