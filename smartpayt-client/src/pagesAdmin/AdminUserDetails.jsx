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

    // Helper function to get token and set headers
    const getAuthHeaders = () => {
        const token = localStorage.getItem("Admin_token");
        if (!token) {
            navigate("/adminlogin");
            return null; // Return null to indicate missing token
        }
        return {
            "Cache-Control": "no-cache",
            // ✅ แก้ไข Header เป็น Authorization (A ใหญ่)
            Authorization: `Bearer ${token}`,
        };
    };


    useEffect(() => {
        const fetchUserDetails = async () => {
            const headers = getAuthHeaders();
            if (!headers) return; // Stop if no token

            try {
                // ✅ แก้ไข URL ให้มี /api/admin/
                const response = await axios.get(
                    `${import.meta.env.VITE_API_BASE_URL}/api/admin/users/${lineUserId}`,
                    { headers }
                );

                if (response && response.data) {
                    setUser(response.data.user || {});
                } else {
                    setError("ไม่สามารถดึงข้อมูลผู้ใช้ได้ (Response ไม่มีข้อมูล)");
                }
            } catch (error) {
                console.error("Error fetching user details:", error.response?.data || error.message);
                setError(`ไม่สามารถดึงข้อมูลผู้ใช้ได้ (${error.response?.status || 'Network Error'})`);
                 if (error.response?.status === 401 || error.response?.status === 403) {
                     navigate('/adminlogin');
                 }
            }
        };

        const fetchUserAddressesAndBills = async () => {
             const headers = getAuthHeaders();
             if (!headers) return;

             try {
                // ✅ แก้ไข URL ให้มี /api/admin/
                const addressResponse = await axios.get(
                    `${import.meta.env.VITE_API_BASE_URL}/api/admin/users/address/${lineUserId}`,
                    { headers }
                );
                const addresses = addressResponse.data.addresses || [];
                setUserAddresses(addresses);

                if (addresses.length === 0) {
                    setBillsMap({}); // ไม่มีที่อยู่ ก็ไม่มีบิล
                    return;
                }

                // โหลดบิลของทุกบ้านพร้อมกัน
                const billsPromises = addresses.map(address =>
                    axios.get(
                        // ✅ แก้ไข URL ให้มี /api/admin/
                        `${import.meta.env.VITE_API_BASE_URL}/api/admin/users/address/bills/${address.address_id}`,
                        { headers }
                    ).then(res => ({
                        address_id: address.address_id,
                        // ✅ แก้ไขการกรอง Bill ให้ใช้ status === 0
                        bills: (res.data.bills || [])
                                .filter(bill => bill.status === 0) // กรองเฉพาะที่ยังไม่จ่าย (status=0)
                                .sort((a, b) => new Date(b.due_date) - new Date(a.due_date)) // เรียงตาม due_date ล่าสุดก่อน
                    }))
                    .catch(err => {
                        console.error(`เกิดข้อผิดพลาดในการดึงบิลของบ้าน ${address.address_id}:`, err.response?.data || err.message);
                        return { address_id: address.address_id, bills: [] }; // คืนค่าว่างถ้าโหลดบิลไม่สำเร็จ
                    })
                );

                const billsData = await Promise.all(billsPromises);

                const newBillsMap = billsData.reduce((acc, { address_id, bills }) => {
                    acc[address_id] = bills;
                    return acc;
                }, {});
                setBillsMap(newBillsMap);

            } catch (error) {
                console.error("เกิดข้อผิดพลาดในการดึงข้อมูลที่อยู่หรือบิล:", error.response?.data || error.message);
                setError(`ไม่สามารถดึงข้อมูลที่อยู่หรือบิลได้ (${error.response?.status || 'Network Error'})`);
                 if (error.response?.status === 401 || error.response?.status === 403) {
                     navigate('/adminlogin');
                 }
            }
        };

        fetchUserDetails();
        fetchUserAddressesAndBills(); // รวมการโหลดที่อยู่และบิลไว้ด้วยกัน
    }, [lineUserId, navigate]); // เอา navigate ออกถ้า useEffect ไม่ได้ใช้ navigate โดยตรง

    const handleVerifyAddress = async (addressId) => {
        const headers = getAuthHeaders();
        if (!headers) {
             alert("กรุณาล็อกอินเพื่อดำเนินการต่อ");
             return;
        }

        try {
            // ✅ แก้ไข Method เป็น POST
            // ✅ แก้ไข URL เป็น /api/admin/verify-address/:addressId (ไม่มี lineUserId)
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/admin/verify-address/${addressId}`,
                {}, // Body ของ POST (ไม่ต้องส่งข้อมูล)
                { headers }
            );

            if (response.data && response.data.success) {
                setUserAddresses((prevAddresses) =>
                    prevAddresses.map((address) =>
                        address.address_id === addressId
                            // ✅ แก้ไข: อัปเดต state เป็น 1 (ไม่ใช่ true) ให้ตรงกับ DB
                            ? { ...address, address_verified: 1 }
                            : address
                    )
                );
                 setError(''); // ล้าง error ถ้าสำเร็จ
            } else {
                setError(response.data.message || "เกิดข้อผิดพลาดในการยืนยันที่อยู่ (Response ไม่สำเร็จ)");
            }
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการยืนยันที่อยู่:", error.response?.data || error.message);
            setError(`ไม่สามารถยืนยันที่อยู่ได้ (${error.response?.status || 'Network Error'})`);
             if (error.response?.status === 401 || error.response?.status === 403) {
                 navigate('/adminlogin');
             }
        }
    };

    const toggleExpand = (addressId) => {
        setExpanded((prevExpanded) => ({
            ...prevExpanded,
            [addressId]: !prevExpanded[addressId],
        }));
    };

    const handleAddAddress = () => {
        navigate(`/api/admin/users/${lineUserId}/add-address`);
    };

    // ... (ส่วน JSX ที่เหลือเหมือนเดิม) ...
    // Note: ใน JSX ส่วนแสดง Bill status ให้ใช้ bill.status === 0 เช็คแทน boolean
    // เช่น <td className={bill.status === 0 ? "text-red-500" : "text-green-500"}>
    //         {bill.status === 0 ? "ยังไม่ชำระ" : "ชำระแล้ว"}
    //      </td>

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
           {/* ... Header ... */}
           <div className="flex items-center justify-between p-4 bg-white shadow">
                <button onClick={() => navigate("/admin/service")} className="text-gray-800 p-2"> {/* แก้ให้กลับไปหน้า Service */}
                    กลับไปยังหน้ารายชื่อผู้ใช้
                </button>
                <h2 className="text-2xl font-bold text-gray-800">รายละเอียดผู้ใช้</h2>
           </div>

            <div className="flex-1 p-5">
                {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}
                {user === null ? (
                    <p>กำลังโหลดข้อมูล...</p>
                ) : (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-2xl font-semibold mb-4">ข้อมูลผู้ใช้</h3>
                        {/* ... User Table ... */}
                         <div className="overflow-x-auto">
                            <table className="table-auto w-full border-collapse mb-6">
                                {/* ... table head ... */}
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 border-b text-left">ชื่อ-นามสกุล</th>
                                        <th className="px-4 py-2 border-b text-left">ID Card No</th>
                                        <th className="px-4 py-2 border-b text-left">Phone No</th>
                                        <th className="px-4 py-2 border-b text-left">Email</th>
                                        <th className="px-4 py-2 border-b text-left">Line User ID</th>
                                        <th className="px-4 py-2 border-b text-left">วันที่สมัคร</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="px-4 py-2 border-b">{user.name || '-'}</td>
                                        <td className="px-4 py-2 border-b">{user.ID_card_No || '-'}</td>
                                        <td className="px-4 py-2 border-b">{user.Phone_No || '-'}</td>
                                        <td className="px-4 py-2 border-b">{user.Email || '-'}</td>
                                        <td className="px-4 py-2 border-b">{user.lineUserId || '-'}</td>
                                        <td className="px-4 py-2 border-b">{user.created_at ? new Date(user.created_at).toLocaleDateString('th-TH') : '-'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <h3 className="text-2xl font-semibold mt-6 mb-4">ที่อยู่ของผู้ใช้</h3>
                        {userAddresses && userAddresses.length > 0 ? (
                            userAddresses.map((address) => (
                                <div key={address.address_id} className="border my-4 bg-gray-50 rounded-lg p-4 shadow-sm">
                                    <div onClick={() => toggleExpand(address.address_id)} className="cursor-pointer mb-3">
                                        {/* ... Address Details ... */}
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                                            <p><span className="font-semibold">บ้านเลขที่:</span> {address.house_no || '-'}</p>
                                            <p><span className="font-semibold">หมู่ที่:</span> {address.village_no || '-'}</p>
                                            <p><span className="font-semibold">ถนน/ซอย:</span> {address.Alley || '-'}</p>
                                            <p><span className="font-semibold">ตำบล/แขวง:</span> {address.sub_district || '-'}</p>
                                            <p><span className="font-semibold">อำเภอ/เขต:</span> {address.district || '-'}</p>
                                            <p><span className="font-semibold">จังหวัด:</span> {address.province || '-'}</p>
                                            <p><span className="font-semibold">รหัสไปรษณีย์:</span> {address.postal_code || '-'}</p>
                                        </div>
                                        <div className="flex items-center mt-3">
                                            <p className={`font-semibold mr-3 ${address.address_verified === 1 ? "text-green-600" : "text-red-600"}`}>
                                                 สถานะ: {address.address_verified === 1 ? "ยืนยันแล้ว" : "ยังไม่ยืนยัน"}
                                            </p>
                                            {address.address_verified !== 1 && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleVerifyAddress(address.address_id); }} // Prevent expand/collapse when clicking button
                                                    className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 text-sm"
                                                >
                                                    ยืนยันที่อยู่
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {expanded[address.address_id] && (
                                        <div className="mt-3 pt-3 border-t">
                                            <h4 className="text-lg font-semibold mb-2">📄 บิลที่ยังไม่ชำระ:</h4>
                                            {billsMap[address.address_id] && billsMap[address.address_id].length > 0 ? (
                                                <div className="overflow-x-auto">
                                                <table className="table-auto w-full border-collapse text-sm">
                                                    {/* ... Bills Table Head ... */}
                                                    <thead>
                                                        <tr className="bg-gray-200">
                                                            <th className="px-3 py-2 border-b text-left">จำนวนเงิน (บาท)</th>
                                                            <th className="px-3 py-2 border-b text-left">วันที่ครบกำหนด</th>
                                                            <th className="px-3 py-2 border-b text-left">สถานะ</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {billsMap[address.address_id].map((bill, index) => (
                                                            <tr key={index} className="hover:bg-gray-100">
                                                                <td className="px-3 py-2 border-b">{parseFloat(bill.amount_due).toFixed(2)}</td>
                                                                <td className="px-3 py-2 border-b">
                                                                    {bill.due_date ? new Date(bill.due_date).toLocaleDateString('th-TH') : "ไม่ระบุ"}
                                                                </td>
                                                                {/* ✅ แก้ไข: ใช้ bill.status === 0 */}
                                                                <td className={`px-3 py-2 border-b font-medium ${bill.status === 0 ? "text-red-600" : "text-green-600"}`}>
                                                                    {bill.status === 0 ? "ยังไม่ชำระ" : "ชำระแล้ว"}
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
                                    )}
                                </div>
                            ))
                        ) : (
                             <p className="text-gray-500 italic">ไม่พบข้อมูลที่อยู่สำหรับผู้ใช้นี้</p>
                        )}
                        <div className="mt-6">
                            <button onClick={handleAddAddress} className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600">
                                เพิ่มที่อยู่ใหม่
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDetails;