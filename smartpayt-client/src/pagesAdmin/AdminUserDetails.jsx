import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// 1. Import ไอคอน
import {
    FaCheckCircle,
    FaChevronDown,
    FaChevronLeft,
    FaExclamationCircle,
    FaHome,
    FaPlus,
    FaTimesCircle,
    FaUserCircle
} from "react-icons/fa";

// (Helper function)
const DetailItem = ({ label, value }) => (
  <div className="sm:col-span-1">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900">{value || '-'}</dd>
  </div>
);

const UserDetails = () => {
  const [user, setUser] = useState(null);
  const [userAddresses, setUserAddresses] = useState([]);
  const [billsMap, setBillsMap] = useState({});
  const [error, setError] = useState("");
  const { lineUserId } = useParams();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState({});
  
  // 2. (เพิ่ม) State สำหรับ Loading
  const [loading, setLoading] = useState(true);

  // ... (getAuthHeaders function เหมือนเดิม) ...
  const getAuthHeaders = () => {
    const token = localStorage.getItem("Admin_token");
    if (!token) {
      navigate("/adminlogin");
      return null;
    }
    return {
      "Cache-Control": "no-cache",
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError("");
      const headers = getAuthHeaders();
      if (!headers) {
        setLoading(false);
        return;
      }

      try {
        // 1. โหลดข้อมูลผู้ใช้
        const userPromise = axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/admin/users/${lineUserId}`,
          { headers }
        );
        
        // 2. โหลดที่อยู่
        const addressPromise = axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/admin/users/address/${lineUserId}`,
          { headers }
        );

        const [userResponse, addressResponse] = await Promise.all([userPromise, addressPromise]);

        // 3. ตั้งค่าข้อมูลผู้ใช้
        if (userResponse && userResponse.data) {
          setUser(userResponse.data.user || {});
        } else {
          setError("ไม่สามารถดึงข้อมูลผู้ใช้ได้");
        }

        // 4. ตั้งค่าที่อยู่
        const addresses = addressResponse.data.addresses || [];
        setUserAddresses(addresses);

        if (addresses.length === 0) {
          setBillsMap({});
          setLoading(false);
          return; // จบการทำงานถ้าไม่มีที่อยู่
        }

        // 5. โหลดบิลของทุกบ้าน (ถ้ามีที่อยู่)
        const billsPromises = addresses.map(address =>
          axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/admin/users/address/bills/${address.address_id}`,
            { headers }
          ).then(res => ({
            address_id: address.address_id,
            bills: (res.data.bills || [])
              .filter(bill => bill.status === 0)
              .sort((a, b) => new Date(b.due_date) - new Date(a.due_date))
          }))
          .catch(err => {
            console.error(`เกิดข้อผิดพลาดในการดึงบิลของบ้าน ${address.address_id}:`, err.message);
            return { address_id: address.address_id, bills: [] };
          })
        );

        const billsData = await Promise.all(billsPromises);
        const newBillsMap = billsData.reduce((acc, { address_id, bills }) => {
          acc[address_id] = bills;
          return acc;
        }, {});
        setBillsMap(newBillsMap);

      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error.response?.data || error.message);
        setError(`ไม่สามารถดึงข้อมูลได้ (${error.response?.status || 'Network Error'})`);
        if (error.response?.status === 401 || error.response?.status === 403) {
          navigate('/adminlogin');
        }
      } finally {
        setLoading(false); // 6. โหลดเสร็จทั้งหมด
      }
    };

    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineUserId]); // navigate ไม่จำเป็นต้องอยู่ใน dependency array

  // ... (handleVerifyAddress, toggleExpand, handleAddAddress functions เหมือนเดิม) ...
  const handleVerifyAddress = async (addressId) => {
    // ... (โค้ดเดิม) ...
    const headers = getAuthHeaders();
    if (!headers) { alert("กรุณาล็อกอินเพื่อดำเนินการต่อ"); return; }
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/verify-address/${addressId}`,
        {}, { headers }
      );
      if (response.data && response.data.success) {
        setUserAddresses((prevAddresses) =>
          prevAddresses.map((address) =>
            address.address_id === addressId ? { ...address, address_verified: 1 } : address
          )
        );
        setError('');
      } else {
        setError(response.data.message || "เกิดข้อผิดพลาดในการยืนยันที่อยู่");
      }
    } catch (error) {
      // ... (โค้ดเดิม) ...
      console.error("เกิดข้อผิดพลาดในการยืนยันที่อยู่:", error.response?.data || error.message);
      setError(`ไม่สามารถยืนยันที่อยู่ได้ (${error.response?.status || 'Network Error'})`);
      if (error.response?.status === 401 || error.response?.status === 403) {
          navigate('/adminlogin');
      }
    }
  };
  const toggleExpand = (addressId) => {
    setExpanded((prev) => ({ ...prev, [addressId]: !prev[addressId] }));
  };
  const handleAddAddress = () => {
    navigate(`/api/admin/users/${lineUserId}/add-address`);
  };


  // 7. (ปรับปรุง) JSX ทั้งหมด
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* 8. (ปรับปรุง) Header */}
      <div className="flex items-center justify-between p-4 bg-white shadow-md">
        <button
          onClick={() => navigate("/admin/service")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <FaChevronLeft className="h-4 w-4" />
          กลับ
        </button>
        <h2 className="text-xl font-bold text-gray-800">รายละเอียดผู้ใช้</h2>
        <div className="w-20"></div> {/* Spacer รักษากึ่งกลาง */}
      </div>

      {/* 9. (ปรับปรุง) Loading, Error, Content Wrapper */}
      <div className="flex-1 p-5">
        {error && (
          <div className="text-center p-4 mb-4 text-red-700 bg-red-100 rounded-lg flex items-center justify-center gap-2">
            <FaExclamationCircle /> {error}
          </div>
        )}
        {loading ? (
          <div className="text-center p-10 text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4">กำลังโหลดข้อมูล...</p>
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* 10. (ปรับปรุง) การ์ดข้อมูลผู้ใช้ */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <FaUserCircle className="text-3xl text-gray-400" />
                <h3 className="text-2xl font-semibold text-gray-800">ข้อมูลผู้ใช้</h3>
              </div>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <DetailItem label="ชื่อ-นามสกุล" value={user.name} />
                <DetailItem label="ID Card No" value={user.ID_card_No} />
                <DetailItem label="Phone No" value={user.Phone_No} />
                <DetailItem label="Email" value={user.Email} />
                <DetailItem label="Line User ID" value={user.lineUserId} />
                <DetailItem label="วันที่สมัคร" value={user.created_at ? new Date(user.created_at).toLocaleDateString('th-TH') : '-'} />
              </dl>
            </div>

            {/* 11. (ปรับปรุง) โซนที่อยู่ */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold text-gray-800">ที่อยู่ของผู้ใช้</h3>
                <button 
                  onClick={handleAddAddress} 
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  <FaPlus />
                  เพิ่มที่อยู่ใหม่
                </button>
              </div>

              {userAddresses.length > 0 ? (
                <div className="space-y-4">
                  {userAddresses.map((address) => (
                    // 12. (ปรับปรุง) การ์ดที่อยู่
                    <div key={address.address_id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      {/* Header การ์ด (Clickable) */}
                      <div
                        className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleExpand(address.address_id)}
                      >
                        <div className="flex items-center gap-3">
                          <FaHome className="text-xl text-green-600" />
                          <div>
                            <span className="font-semibold text-gray-900">
                              บ้านเลขที่: {address.house_no || '-'}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">
                              ({address.sub_district || '-'}, {address.district || '-'})
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {address.address_verified === 1 ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <FaCheckCircle /> ยืนยันแล้ว
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <FaTimesCircle /> ยังไม่ยืนยัน
                            </span>
                          )}
                          <FaChevronDown className={`text-gray-400 transition-transform ${expanded[address.address_id] ? 'rotate-180' : 'rotate-0'}`} />
                        </div>
                      </div>

                      {/* 13. (ปรับปรุง) ส่วนที่พับได้ */}
                      {expanded[address.address_id] && (
                        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-4">
                          {/* รายละเอียดที่อยู่ */}
                          <div>
                            <h4 className="font-semibold mb-2 text-gray-800">รายละเอียดที่อยู่:</h4>
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                              <DetailItem label="บ้านเลขที่" value={address.house_no} />
                              <DetailItem label="หมู่ที่" value={address.village_no} />
                              <DetailItem label="ถนน/ซอย" value={address.Alley} />
                              <DetailItem label="ตำบล/แขวง" value={address.sub_district} />
                              <DetailItem label="อำเภอ/เขต" value={address.district} />
                              <DetailItem label="จังหวัด" value={address.province} />
                              <DetailItem label="รหัสไปรษณีย์" value={address.postal_code} />
                            </dl>
                          </div>

                          {/* ปุ่มยืนยัน (ถ้ายังไม่ยืนยัน) */}
                          {address.address_verified !== 1 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleVerifyAddress(address.address_id); }}
                              className="bg-green-600 text-white px-4 py-1.5 rounded-md hover:bg-green-700 text-sm font-semibold"
                            >
                              ยืนยันที่อยู่
                            </button>
                          )}

                          {/* ตารางบิล */}
                          <div>
                            <h4 className="text-lg font-semibold mb-2 text-gray-800">📄 บิลที่ยังไม่ชำระ:</h4>
                            {billsMap[address.address_id] && billsMap[address.address_id].length > 0 ? (
                              <div className="overflow-x-auto rounded border">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-3 py-2 text-left font-medium text-gray-600">จำนวนเงิน (บาท)</th>
                                      <th className="px-3 py-2 text-left font-medium text-gray-600">วันที่ครบกำหนด</th>
                                      <th className="px-3 py-2 text-left font-medium text-gray-600">สถานะ</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {billsMap[address.address_id].map((bill, index) => (
                                      <tr key={index} className="bg-white">
                                        <td className="px-3 py-2">{parseFloat(bill.amount_due).toFixed(2)}</td>
                                        <td className="px-3 py-2">
                                          {bill.due_date ? new Date(bill.due_date).toLocaleDateString('th-TH') : "ไม่ระบุ"}
                                        </td>
                                        <td className="px-3 py-2 font-medium text-red-600">
                                          ยังไม่ชำระ
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-gray-500 italic">ไม่มีบิลที่ต้องชำระสำหรับที่อยู่นี้</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // 14. (ปรับปรุง) Empty State
                <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500 italic">
                  ไม่พบข้อมูลที่อยู่สำหรับผู้ใช้นี้
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default UserDetails;