import axios from "axios";
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NavbarComponent from "../assets/component/user/userNavbar";
import qrImage from "../assets/img/qr.jpg";

const QRPaymentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // ดึงข้อมูลที่ส่งมาจากหน้าก่อน
    const { selectedBills, totalAmount } = location.state || {};

    const [image, setImage] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        setImage(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!image) {
            alert("กรุณาเลือกภาพสลิปก่อน");
            return;
        }

        const formData = new FormData();
        formData.append("slip", image);
        formData.append("bill_ids", JSON.stringify(selectedBills));

        try {
            setUploading(true);
            await axios.post("/api/user/upload-slip", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            }).then((res) => {
                console.log("📦 RESPONSE FROM SERVER:", res.data);
                alert("อัปโหลดสำเร็จ 🎉");
                navigate("/userDashboard");
            });

        } catch (error) {
            console.error("อัปโหลดผิดพลาด:", error);
            alert("เกิดข้อผิดพลาดในการอัปโหลด");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
        <NavbarComponent/>
        <div className="p-6 max-w-lg mx-auto bg-white rounded shadow mt-8">
            <h1 className="text-xl font-bold mb-4">📷 ชำระเงินผ่าน QR Code</h1>
            
            {/* START: โค้ดสำหรับปิด QR Code ด้วยตราประทับ "CURRENTLY UNAVAILABLE" ที่สวยงามขึ้น */}
            <div className="relative w-full mb-4">
                <img src={qrImage} alt="QR Code" className="w-full filter grayscale opacity-60" />
                
                {/* สไตล์ตราประทับที่สวยงามขึ้น */}
                <div 
                    className="absolute inset-0 flex items-center justify-center 
                                transform -rotate-12" /* หมุนกลับทิศเล็กน้อยเพื่อความสวยงาม */
                >
                    <span 
                        className="text-white text-4xl sm:text-5xl font-extrabold 
                                   bg-red-700 bg-opacity-80 border-4 border-red-500 
                                   p-4 px-8 rounded-lg shadow-lg 
                                   uppercase tracking-widest leading-none select-none"
                        style={{ /* เพิ่มสไตล์ CSS แบบ inline สำหรับเอฟเฟกต์ตราประทับ */
                            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                            transform: 'skewX(-15deg)', // ทำให้ตัวอักษรเอียงเล็กน้อย
                        }}
                    >
                        UNAVAILABLE
                    </span>
                </div>
            </div>
            {/* END: โค้ดสำหรับปิด QR Code */}
            
            <p className="mb-2">💵 ยอดรวมที่ต้องชำระ: <strong>{totalAmount.toFixed(2)} บาท</strong></p>

            <input type="file" accept="image/*" onChange={handleFileChange} />

            <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full mt-4 bg-green-600 text-white font-semibold py-2 rounded hover:bg-green-700"
            >
                {uploading ? "กำลังอัปโหลด..." : "📤 อัปโหลดสลิป"}
            </button>
        </div>
        </div>
    );
};

export default QRPaymentPage;