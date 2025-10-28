import axios from "axios";
import { useEffect, useState } from "react"; // 1. (เพิ่ม) Import useEffect
import { useNavigate, useParams } from "react-router-dom";
import ToastNotification from "../assets/component/user/ToastNotification";

// 2. (เพิ่ม) Import ไอคอน
import {
  FaChevronLeft,
  FaHome,
  FaSave
} from "react-icons/fa";

// (Helper function)
const FormInput = ({ label, name, value, onChange, required = false, type = "text" }) => (
  <div className={name === "Alley" ? "md:col-span-2" : "md:col-span-1"}>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
    />
  </div>
);


const AddUserAddress = () => {
  const { lineUserId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    house_no: "",
    village_no: "",
    Alley: "", // 3. (แก้ไข) เปลี่ยน "alley" เป็น "Alley" (A ใหญ่) ให้ตรงกับ UserDetails
    province: "",
    district: "",
    sub_district: "",
    postal_code: "",
    address_type: "household",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 4. (ปรับปรุง) สร้างฟังก์ชันแยกสำหรับ Toast
  const showToast = (type, text) => {
    if (type === 'success') {
      setMessage(text);
      setError('');
    } else {
      setMessage('');
      setError(text);
    }
  };
  
  // 5. (ปรับปรุง) useEffect สำหรับล้าง Toast
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage('');
        setError('');
      }, 3000); // 3 วินาที
      return () => clearTimeout(timer);
    }
  }, [message, error]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    // (ล้าง Toast เก่าก่อน Submit)
    setMessage('');
    setError(''); 
    setIsSubmitting(true);

    const requiredFields = [
      "house_no", "village_no", "province", "district",
      "sub_district", "postal_code", "address_type",
    ];
    
    for (let field of requiredFields) {
      if (!formData[field]) {
        showToast('error', 'กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem("Admin_token");
      if (!token) {
        showToast('error', 'Authentication error: Token not found.');
        setTimeout(() => navigate("/adminlogin"), 2000); // 6. (แก้ไข) ไปหน้า adminlogin
        setIsSubmitting(false);
        return;
      }

      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/admin/users/${lineUserId}/add-address`;
      const response = await axios.post(apiUrl, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        showToast('success', 'ลงทะเบียนที่อยู่สำเร็จ!');
        setTimeout(() => navigate(`/admin/user/${lineUserId}`), 2000); // กลับไปหน้า UserDetails
      } else {
        showToast('error', response.data.error || "เกิดข้อผิดพลาดในการลงทะเบียน (Server)");
      }
    } catch (err) {
      console.error("Add address error:", err.response?.data || err.message);
      if (err.response?.status === 401 || err.response?.status === 403) {
        showToast('error', 'Authentication failed. Please log in again.');
        setTimeout(() => navigate("/adminlogin"), 2000);
      } else {
        showToast('error', err.response?.data?.error || "เกิดข้อผิดพลาดไม่คาดคิด");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. (ปรับปรุง) JSX ทั้งหมด
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* 8. (ปรับปรุง) Toast ลอยมุมบนขวา */}
      <div className="fixed top-4 right-4 z-50">
        <ToastNotification message={message} error={error} />
      </div>

      {/* 9. (เพิ่ม) Header */}
      <div className="flex items-center justify-between p-4 bg-white shadow-md">
        <button
          onClick={() => navigate(`/admin/user/${lineUserId}`)} // กลับไปหน้า User Detail
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <FaChevronLeft className="h-4 w-4" />
          กลับ
        </button>
        <h2 className="text-xl font-bold text-gray-800">เพิ่มที่อยู่ใหม่</h2>
        <div className="w-20"></div> {/* Spacer รักษากึ่งกลาง */}
      </div>

      {/* 10. (ปรับปรุง) Form Card */}
      <div className="flex-1 p-5">
        <form
          onSubmit={handleSubmit}
          className="max-w-xl mx-auto p-6 md:p-8 bg-white rounded-lg shadow-md"
        >
          <div className="flex items-center gap-3 mb-6 border-b pb-4">
            <FaHome className="text-2xl text-green-600" />
            <h1 className="text-2xl font-semibold text-gray-800">กรอกรายละเอียดที่อยู่</h1>
          </div>
          
          {/* 11. (ปรับปรุง) Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormInput label="บ้านเลขที่" name="house_no" value={formData.house_no} onChange={handleChange} required />
            <FormInput label="หมู่ที่" name="village_no" value={formData.village_no} onChange={handleChange} required />
            <FormInput label="ตรอก / ซอย" name="Alley" value={formData.Alley} onChange={handleChange} />
            <FormInput label="ตำบล / แขวง" name="sub_district" value={formData.sub_district} onChange={handleChange} required />
            <FormInput label="อำเภอ / เขต" name="district" value={formData.district} onChange={handleChange} required />
            <FormInput label="จังหวัด" name="province" value={formData.province} onChange={handleChange} required />
            <FormInput label="รหัสไปรษณีย์" name="postal_code" value={formData.postal_code} onChange={handleChange} required />

            {/* Address Type (แยกออกมาเพราะเป็น select) */}
            <div className="md:col-span-2">
              <label htmlFor="address_type" className="block text-sm font-medium text-gray-700 mb-1">
                ประเภทที่อยู่ <span className="text-red-500">*</span>
              </label>
              <select
                id="address_type"
                name="address_type"
                value={formData.address_type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="household">ครัวเรือน</option>
                <option value="establishment">สถานประกอบการ</option>
              </select>
            </div>
          </div>

          {/* 12. (ปรับปรุง) Submit Button */}
          <div className="mt-8 border-t pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2 text-white py-2.5 rounded-lg transition-all text-base font-medium ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg'
              }`}
            >
              <FaSave />
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกที่อยู่'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserAddress;