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
            alert("กรุณาแนบหลักฐานการชำระเงินก่อน");
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
            <img src={qrImage} alt="QR Code" className="w-full mb-4" />
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
