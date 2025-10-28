import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from '../pagesAdmin/component/AdminLayout'; // 1. Import AdminLayout

// 2. Import ไอคอนมาเพิ่ม
import {
  FaCheck,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaEye,
  FaTimes,
  FaTimesCircle
} from "react-icons/fa";

// 3. (เพิ่ม) Component "Pill" สำหรับแสดงสถานะ
const StatusPill = ({ status }) => {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <FaCheckCircle />
        ผ่าน
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <FaTimesCircle />
        ไม่ผ่าน
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      <FaClock />
      รอตรวจสอบ
    </span>
  );
};


const AdminSlipList = () => {
  // 4. (เพิ่ม) State สำหรับ Loading และ Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [slips, setSlips] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();

  // 5. (ปรับปรุง) fetchSlips ให้มี Loading/Error
  const fetchSlips = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/payment-slips`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("Admin_token")}` },
      });
      setSlips(res.data);
    } catch (err) {
      console.error("ดึงข้อมูลสลิปล้มเหลว:", err);
      setError("ไม่สามารถดึงข้อมูลสลิปได้");
      if (err.response?.status === 401) {
        alert("กรุณาเข้าสู่ระบบใหม่");
        navigate("/adminlogin");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    // (เพิ่ม UX) ถามยืนยันก่อน
    const confirmMessage = status === 'approved' ? 'คุณต้องการยืนยันสลิปนี้ใช่หรือไม่?' : 'คุณต้องการปฏิเสธสลิปนี้ใช่หรือไม่?';
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/payment-slips/${id}`, { status }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("Admin_token")}` },
      });
      fetchSlips(); // โหลดข้อมูลใหม่
    } catch (err) {
      console.error("❌ อัปเดตสถานะล้มเหลว:", err);
      alert("อัปเดตสถานะล้มเหลว");
    }
  };

  useEffect(() => {
    fetchSlips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 6. (ปรับปรุง) JSX ทั้งหมด
  return (
    <AdminLayout>
      <>
        <h1 className="text-3xl font-bold mb-6 text-gray-800">รายการสลิปที่ส่งเข้ามา</h1>
        
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          {loading ? (
            <div className="text-center p-10 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4">กำลังโหลดข้อมูล...</p>
            </div>
          ) : error ? (
            <div className="text-center p-10 text-red-600 flex flex-col items-center gap-2">
              <FaExclamationCircle className="h-8 w-8" />
              <p>{error}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              {/* 7. (ปรับปรุง) Table Header */}
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ที่อยู่</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ยอด</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เวลา</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">สลิป</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ตรวจสอบ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {slips.length > 0 ? (
                  slips.map((slip) => (
                    <tr key={slip.id} className="hover:bg-gray-50">
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{slip.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{`${slip.house_no}, ${slip.sub_district}, ${slip.district}`}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-900">{parseFloat(slip.amount_due).toFixed(2)} ฿</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{new Date(slip.uploaded_at).toLocaleString('th-TH')}</div>
                      </td>
                      
                      {/* 8. (ปรับปรุง) ปุ่มดูสลิป */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button 
                          className="flex items-center gap-1 text-green-600 hover:text-green-800"
                          onClick={() => setPreviewImage(`${import.meta.env.VITE_API_BASE_URL}/${slip.image_path.replace(/\\/g, "/")}`)}
                        >
                          <FaEye /> ดูสลิป
                        </button>
                      </td>
                      
                      {/* 9. (ปรับปรุง) สถานะ (Pill) */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <StatusPill status={slip.status} />
                      </td>
                      
                      {/* 10. (ปรับปรุง) ปุ่มตรวจสอบ */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {slip.status === "pending" ? (
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => updateStatus(slip.id, "approved")} 
                              className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                            >
                              <FaCheck /> ผ่าน
                            </button>
                            <button 
                              onClick={() => updateStatus(slip.id, "rejected")} 
                              className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                            >
                              <FaTimes /> ไม่ผ่าน
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">ตรวจสอบแล้ว</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  // 11. (ปรับปรุง) Empty State
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                      ยังไม่มีสลิปที่ต้องตรวจสอบ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* 12. (ปรับปรุง) Modal สำหรับดูสลิป */}
        {previewImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" 
            onClick={() => setPreviewImage(null)}
          >
            <div 
              className="relative bg-white p-4 rounded-lg shadow-2xl" 
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                className="absolute top-2 right-2 text-gray-400 hover:text-red-600 transition-colors" 
                onClick={() => setPreviewImage(null)}
              >
                <FaTimesCircle className="h-7 w-7" />
              </button>
              <img src={previewImage} alt="สลิป" className="max-w-[90vw] max-h-[85vh] rounded" />
            </div>
          </div>
        )}
      </>
    </AdminLayout>
  );
};

export default AdminSlipList;