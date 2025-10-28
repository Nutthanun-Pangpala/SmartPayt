import axios from "axios";
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ToastNotification from "../assets/component/user/ToastNotification"; // Make sure path is correct

const AddUserAddress = () => { // Renamed component for clarity
  const { lineUserId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // lineUserId ไม่จำเป็นต้องอยู่ใน state เพราะเราได้จาก URL param อยู่แล้ว
    house_no: "",
    village_no: "",
    alley: "",
    province: "",
    district: "",
    sub_district: "",
    postal_code: "",
    // ✅ 1. เพิ่ม address_type ใน state (กำหนดค่าเริ่มต้นเป็น household)
    address_type: "household",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // เพิ่ม state สำหรับกันกด submit ซ้ำ

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // กันกดซ้ำ
    setError("");
    setMessage("");
    setIsSubmitting(true);

    // ✅ 2. เพิ่ม village_no และ address_type ใน requiredFields
    const requiredFields = [
      "house_no",
      "village_no", // <-- เพิ่ม
      "province",
      "district",
      "sub_district",
      "postal_code",
      "address_type", // <-- เพิ่ม
    ];
    for (let field of requiredFields) {
      if (!formData[field]) {
        setError("กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน");
        setIsSubmitting(false); // ปลดล็อคปุ่ม submit
        return;
      }
    }

    try {
      const token = localStorage.getItem("Admin_token");
      if (!token) {
        setError("Authentication error: Token not found. Please log in again.");
        // ✅ 3. แก้ Redirect ไปหน้า login
        setTimeout(() => navigate("/admin"), 2000);
        setIsSubmitting(false);
        return;
      }

      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/admin/users/${lineUserId}/add-address`;

      const response = await axios.post(
        apiUrl,
        formData, // ส่ง formData ทั้งหมด (รวม address_type)
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setMessage("ลงทะเบียนที่อยู่สำเร็จ!");
        // ✅ 4. แก้ Redirect (ถ้าหน้า User Details ใช้ /users/)
        setTimeout(() => navigate(`/admin/user/${lineUserId}`), 2000); // หรือ /admin/user/ ถ้า path นั้นถูก
      } else {
        setError(response.data.error || "เกิดข้อผิดพลาดในการลงทะเบียนที่อยู่ (Server)");
      }
    } catch (err) {
      console.error("Add address error:", err.response?.data || err.message);
      // แสดง error ที่เฉพาะเจาะจงขึ้น
      if (err.response?.status === 401 || err.response?.status === 403) {
           setError("Authentication failed. Please log in again.");
           setTimeout(() => navigate("/adminlogin"), 2000);
      } else if (err.response?.status === 400) {
          setError(`ข้อมูลไม่ถูกต้อง: ${err.response.data.error || 'กรุณาตรวจสอบข้อมูลที่กรอก'}`);
      } else if (err.response?.status === 404) {
          setError("API endpoint ไม่พบ");
      } else {
          setError(err.response?.data?.error || "เกิดข้อผิดพลาดไม่คาดคิด กรุณาลองใหม่");
      }
    } finally {
      setIsSubmitting(false); // ปลดล็อคปุ่ม submit ไม่ว่าจะสำเร็จหรือล้มเหลว
    }
  };

  return (
    <div className="container mx-auto p-4"> {/* Added container */}
      <ToastNotification message={message} error={error} />
      <h1 className="text-2xl font-bold mb-6 text-center">เพิ่มที่อยู่สำหรับผู้ใช้</h1> {/* Added title */}
      <form
        onSubmit={handleSubmit}
        className="max-w-lg mx-auto p-6 border rounded-xl shadow-lg bg-white" // Enhanced shadow
      >
        {/* Input Fields */}
        {[
          { label: "บ้านเลขที่", name: "house_no", required: true },
          { label: "หมู่ที่", name: "village_no", required: true },
          { label: "ตรอก / ซอย", name: "alley", required: false },
          { label: "ตำบล / แขวง", name: "sub_district", required: true },
          { label: "อำเภอ / เขต", name: "district", required: true },
          { label: "จังหวัด", name: "province", required: true },
          { label: "รหัสไปรษณีย์", name: "postal_code", required: true },
        ].map(({ label, name, required }) => (
          <div key={name} className="mb-4">
            <label htmlFor={name} className="block text-gray-700 font-medium mb-1"> {/* Added htmlFor and font-medium */}
              {label} {required && <span className="text-red-500">*</span>} {/* Indicate required */}
            </label>
            <input
              id={name} // Added id for label association
              type="text"
              name={name}
              value={formData[name]}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" // Enhanced focus style
              required={required}
            />
          </div>
        ))}

        {/* ✅ 5. เพิ่ม Input สำหรับ address_type */}
        <div className="mb-6"> {/* Increased bottom margin */}
           <label htmlFor="address_type" className="block text-gray-700 font-medium mb-1">
             ประเภทที่อยู่ <span className="text-red-500">*</span>
           </label>
           <select
             id="address_type"
             name="address_type"
             value={formData.address_type}
             onChange={handleChange}
             required // Make sure this is also required
             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white" // Added bg-white for consistency
           >
             <option value="household">ครัวเรือน</option>
             <option value="establishment">สถานประกอบการ</option>
           </select>
         </div>

        <button
          type="submit"
          disabled={isSubmitting} // Disable button while submitting
          className={`w-full text-white py-2.5 rounded-full transition-all ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800'}`} // Adjusted padding and disabled style
        >
          {isSubmitting ? 'กำลังบันทึก...' : 'ลงทะเบียนที่อยู่'}
        </button>
      </form>
    </div>
  );
};

export default AddUserAddress; // Renamed component export