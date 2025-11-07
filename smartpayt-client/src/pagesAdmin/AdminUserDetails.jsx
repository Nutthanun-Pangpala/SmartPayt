import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react"; // ✅ เพิ่ม useMemo, useCallback
import { useNavigate, useParams } from "react-router-dom";

// 1. Import ไอคอน
import {
  FaCheckCircle,
  FaChevronDown,
  FaChevronLeft,
  FaEnvelope,
  FaExclamationCircle,
  FaHome, // เพิ่ม Icon กระเป๋าสตางค์
  FaPhone,
  FaPlus,
  FaTimesCircle,
  FaUserCircle,
  FaWallet
} from "react-icons/fa";

// (Helper function)
const DetailItem = ({ label, value, icon: Icon = null }) => (
  <div className="sm:col-span-1 flex items-start space-x-2">
    {Icon && <Icon className="w-4 h-4 mt-1 text-green-600" />}
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-base font-semibold text-gray-900 break-words">{value || '-'}</dd>
    </div>
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
  const [loading, setLoading] = useState(true);

  // 1. ดึง Headers
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("Admin_token");
    if (!token) {
      navigate("/adminlogin");
      return null;
    }
    return {
      "Cache-Control": "no-cache",
      Authorization: `Bearer ${token}`,
    };
  }, [navigate]); // navigate ต้องอยู่ใน dependency

  // 2. Load Data ทั้งหมด
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError("");
      const headers = getAuthHeaders();
      if (!headers) {
        setLoading(false);
        return;
      }
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

      try {
        // 1. โหลดข้อมูลผู้ใช้
        const userResponse = await axios.get(
          `${API_BASE_URL}/admin/users/${lineUserId}`,
          { headers }
        );
        
        // 2. โหลดที่อยู่
        const addressResponse = await axios.get(
          `${API_BASE_URL}/admin/users/address/${lineUserId}`,
          { headers }
        );

        const fetchedUser = userResponse.data.user || {};
        const addresses = addressResponse.data.addresses || [];
        
        setUser(fetchedUser);
        setUserAddresses(addresses);

        if (addresses.length === 0) {
          setBillsMap({});
          setLoading(false);
          return; 
        }

        // 3. โหลดบิลของทุกบ้าน
        const billsPromises = addresses.map(address =>
          axios.get(
            `${API_BASE_URL}/admin/users/address/bills/${address.address_id}`,
            { headers }
          ).then(res => ({
            address_id: address.address_id,
            // กรองเฉพาะบิลที่ยังไม่ชำระ (status = 0) และเรียงตาม due_date
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
        setLoading(false);
      }
    };

    fetchAllData();
  }, [lineUserId, getAuthHeaders, navigate]); 

  // 3. ยืนยันที่อยู่
  const handleVerifyAddress = async (addressId) => {
    const headers = getAuthHeaders();
    if (!headers) { setError("กรุณาล็อกอินเพื่อดำเนินการต่อ"); return; }
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/verify-address/${addressId}`,
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
      console.error("เกิดข้อผิดพลาดในการยืนยันที่อยู่:", error.response?.data || error.message);
      setError(`ไม่สามารถยืนยันที่อยู่ได้ (${error.response?.status || 'Network Error'})`);
    }
  };
  
  // 4. Toggle Accordion
  const toggleExpand = (addressId) => {
    setExpanded((prev) => ({ ...prev, [addressId]: !prev[addressId] }));
  };
  
  // 5. ปุ่มเพิ่มที่อยู่
  const handleAddAddress = () => {
    // ⚠️ ต้องแก้ไข Route ให้ถูกต้องตามโครงสร้าง Router ของคุณ
    navigate(`/admin/users/${lineUserId}/add-address`); 
  };


  // 6. คำนวณสถานะรวมของบิลค้างชำระ
  const totalUnpaidBills = useMemo(() => {
    return Object.values(billsMap).reduce((sum, bills) => sum + bills.length, 0);
  }, [billsMap]);


  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-4 bg-white shadow sticky top-0 z-10">
        <button
          onClick={() => navigate("/admin/service")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
        >
          <FaChevronLeft className="h-3 w-3" />
          กลับ
        </button>
        <h2 className="text-xl font-bold text-gray-800">รายละเอียดผู้ใช้</h2>
        <div className="w-20"></div> 
      </div>

      {/* Content Wrapper */}
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        {error && (
          <div className="text-center p-4 mb-6 text-red-700 bg-red-100 border-l-4 border-red-500 rounded-lg flex items-center gap-2 shadow-md">
            <FaExclamationCircle /> {error}
          </div>
        )}
        
        {/* Loading State */}
        {loading ? (
          <div className="text-center p-12 text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600 mx-auto"></div>
            <p className="mt-4 text-lg">กำลังโหลดข้อมูล...</p>
          </div>
        ) : user ? (
          <div className="space-y-8">
            
            {/* -------------------------------------
              1. USER INFO CARD
            ------------------------------------- */}
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl border border-gray-200">
              <div className="flex items-center gap-4 mb-6 border-b pb-3">
                <FaUserCircle className="text-4xl text-green-600" />
                <h3 className="text-2xl font-extrabold text-gray-800">{user.name || 'ไม่ระบุชื่อผู้ใช้'}</h3>
                {user.verify_status === 1 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <FaCheckCircle /> บัญชียืนยันแล้ว
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      <FaTimesCircle /> บัญชีไม่ยืนยัน
                    </span>
                  )}
              </div>
              
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                <DetailItem label="ID Card No" value={user.ID_card_No} />
                <DetailItem label="Line User ID" value={user.lineUserId} />
                <DetailItem label="วันที่สมัคร" value={user.created_at ? new Date(user.created_at).toLocaleDateString('th-TH', { dateStyle: 'medium' }) : '-'} />
                <DetailItem label="Phone No" value={user.Phone_No} icon={FaPhone} />
                <DetailItem label="Email" value={user.Email} icon={FaEnvelope} />
                <DetailItem 
                    label="บิลค้างชำระทั้งหมด" 
                    value={`${totalUnpaidBills} บิล`} 
                    icon={FaWallet}
                />
              </dl>
            </div>

            {/* -------------------------------------
              2. ADDRESSES ZONE
            ------------------------------------- */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-800">🏡 ที่อยู่ (รวม {userAddresses.length} แห่ง)</h3>
                <button 
                  onClick={handleAddAddress} 
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-md transition"
                >
                  <FaPlus />
                  เพิ่มที่อยู่ใหม่
                </button>
              </div>

              {userAddresses.length > 0 ? (
                <div className="space-y-4">
                  {userAddresses.map((address) => {
                    const isVerified = address.address_verified === 1;
                    const hasUnpaidBills = billsMap[address.address_id] && billsMap[address.address_id].length > 0;
                    
                    // Card Header Style
                    const headerClass = isVerified 
                        ? 'bg-white border-l-4 border-green-500' 
                        : 'bg-white border-l-4 border-yellow-500';

                    return (
                      // 12. (ปรับปรุง) การ์ดที่อยู่ - Accordion
                      <div key={address.address_id} className={`rounded-xl shadow-lg overflow-hidden ${headerClass}`}>
                        
                        {/* Header การ์ด (Clickable) */}
                        <div
                          className="flex justify-between items-center p-4 md:p-5 cursor-pointer hover:bg-gray-50 transition"
                          onClick={() => toggleExpand(address.address_id)}
                        >
                          <div className="flex items-center gap-4">
                            <FaHome className={`text-2xl ${isVerified ? 'text-green-600' : 'text-yellow-600'}`} />
                            <div>
                              <span className="font-extrabold text-lg text-gray-900">
                                {address.house_no || 'ไม่ระบุบ้านเลขที่'}
                              </span>
                              <span className="text-sm text-gray-500 ml-3">
                                {address.sub_district || '-'} / {address.district || '-'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {/* Status Badge */}
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {isVerified ? <FaCheckCircle /> : <FaTimesCircle />} {isVerified ? 'ยืนยันแล้ว' : 'รอยืนยัน'}
                            </span>
                            {/* Unpaid Bill Tag */}
                            {hasUnpaidBills && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                                  {billsMap[address.address_id].length} ค้างชำระ
                                </span>
                            )}
                            {/* Chevron Icon */}
                            <FaChevronDown className={`text-gray-400 transition-transform w-4 h-4 ${expanded[address.address_id] ? 'rotate-180' : 'rotate-0'}`} />
                          </div>
                        </div>

                        {/* 13. (ปรับปรุง) ส่วนที่พับได้ - Content */}
                        {expanded[address.address_id] && (
                          <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50 space-y-6">
                            
                            {/* รายละเอียดที่อยู่ */}
                            <div>
                              <h4 className="font-bold mb-3 text-gray-700">ข้อมูลที่อยู่โดยละเอียด:</h4>
                              <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                                <DetailItem label="หมู่ที่" value={address.village_no} />
                                <DetailItem label="ถนน/ซอย" value={address.Alley} />
                                <DetailItem label="ประเภท" value={address.address_type === 'household' ? 'ครัวเรือน' : 'สถานประกอบการ'} />
                                <DetailItem label="ตำบล/แขวง" value={address.sub_district} />
                                <DetailItem label="อำเภอ/เขต" value={address.district} />
                                <DetailItem label="จังหวัด" value={address.province} />
                                <DetailItem label="รหัสไปรษณีย์" value={address.postal_code} />
                              </dl>
                            </div>

                            {/* ปุ่มยืนยัน (ถ้ายังไม่ยืนยัน) */}
                            {!isVerified && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleVerifyAddress(address.address_id); }}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-semibold transition shadow-md"
                              >
                                <FaCheckCircle className="inline mr-2" /> ยืนยันที่อยู่ (Address Verification)
                              </button>
                            )}

                            {/* ตารางบิลค้างชำระ */}
                            <div>
                              <h4 className="text-xl font-bold mb-3 text-red-600">
                                🚨 บิลที่ยังไม่ชำระ ({billsMap[address.address_id]?.length || 0} รายการ)
                              </h4>
                              {hasUnpaidBills ? (
                                <div className="overflow-x-auto rounded-lg border border-red-300 shadow-inner">
                                  <table className="min-w-full divide-y divide-red-200">
                                    <thead className="bg-red-50">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-red-700 uppercase">รหัสบิล</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-red-700 uppercase">จำนวนเงิน (บาท)</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-red-700 uppercase">วันที่ครบกำหนด</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-red-700 uppercase">สถานะ</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {billsMap[address.address_id].map((bill, index) => (
                                        <tr key={bill.id || index}>
                                          <td className="px-4 py-2 text-sm font-mono">{bill.id || '-'}</td>
                                          <td className="px-4 py-2 text-sm font-bold text-red-700">{parseFloat(bill.amount_due).toFixed(2)}</td>
                                          <td className="px-4 py-2 text-sm">
                                            {bill.due_date ? new Date(bill.due_date).toLocaleDateString('th-TH') : "ไม่ระบุ"}
                                          </td>
                                          <td className="px-4 py-2 text-sm font-semibold text-red-500">
                                            UNPAID
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-gray-500 italic p-3 bg-gray-100 rounded-lg">ยอดเยี่ยม! ไม่มีบิลค้างชำระสำหรับที่อยู่นี้</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Empty State
                <div className="bg-white p-8 rounded-xl shadow-md text-center text-gray-500 italic border-dashed border-2 border-gray-300">
                  <p className="text-lg">ไม่พบข้อมูลที่อยู่สำหรับผู้ใช้นี้</p>
                  <button 
                    onClick={handleAddAddress} 
                    className="mt-4 flex items-center gap-2 mx-auto bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 text-base font-medium transition"
                  >
                    <FaPlus />
                    เพิ่มที่อยู่แรก
                  </button>
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