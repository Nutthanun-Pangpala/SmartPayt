import axios from "axios";
import { Buffer } from "buffer";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";

const GenerateBarcode = ({ addressId, status }) => {
  const [barcodeUrl, setBarcodeUrl] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden"; // ปิด Scroll
    } else {
      document.body.style.overflow = "auto"; // เปิด Scroll เมื่อปิด Modal
    }

    return () => {
      document.body.style.overflow = "auto"; // คืนค่าเดิมเมื่อ Component ถูก Unmount
    };
  }, [isModalOpen]);

  const fetchBarcode = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:3000/api/generate-barcode/${addressId}`,
        { responseType: "arraybuffer" }
      );
      const buffer = response.data;
      const base64Barcode = Buffer.from(buffer, "binary").toString("base64");
      setBarcodeUrl(`data:image/png;base64,${base64Barcode}`);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching barcode:", error);
      setError("ไม่สามารถสร้างบาร์โค้ดได้");
      setLoading(false);
    }
  };

  const handleGenerateClick = () => {
    if (addressId) {
      fetchBarcode();
      setIsModalOpen(true);
    }
  };

  const handleCloseClick = () => {
    setIsModalOpen(false);
    setBarcodeUrl(null);
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (status === 0) {
    return null; // ซ่อนปุ่มถ้า address ยังไม่ verify
  }

  return (
    <div className="barcode-container">
      <button onClick={handleGenerateClick} className="block">
        <i className="fi fi-ss-barcode-read text-gray-500 block text-2xl"></i>
      </button>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50"
          onClick={handleCloseClick} // ปิดเมื่อคลิกนอก Modal
        >
          <div
            className="bg-white p-6 rounded-lg max-w-sm w-full relative z-10"
            onClick={(e) => e.stopPropagation()} // ป้องกันการปิดถ้าคลิกที่ Modal
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">บาร์โค้ด</h2>
              <button
                onClick={handleCloseClick}
                className="text-red-500 font-bold text-3xl"
              >
                &times;
              </button>
            </div>

            {loading && <p>กำลังสร้างบาร์โค้ด...</p>}

            {barcodeUrl && !loading && (
              <div className="flex justify-center py-4">
                <img src={barcodeUrl} alt="Barcode" className="max-w-full h-auto" />
              </div>
            )}

            {error && <div className="text-red-500">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

GenerateBarcode.propTypes = {
  addressId: PropTypes.string.isRequired,
  status: PropTypes.number.isRequired,
};

export default GenerateBarcode;
