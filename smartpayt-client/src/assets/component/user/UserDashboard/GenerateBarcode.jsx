import axios from "axios";
import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";

// ช่วยแปลง ArrayBuffer -> base64 โดยไม่ต้องใช้ Buffer
function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
}

const GenerateBarcode = ({ addressId, status, addressInfo }) => {
  const [barcodeUrl, setBarcodeUrl] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeBtnRef = useRef(null);

  const isVerified = status === 1 || status === "1" || status === true;

  useEffect(() => {
    // ปิดสกรอลล์พื้นหลังเมื่อเปิดโมดัล
    document.body.style.overflow = isModalOpen ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [isModalOpen]);

  useEffect(() => {
    // ปิดด้วย ESC
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    if (isModalOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isModalOpen]);

  useEffect(() => {
    if (isModalOpen && closeBtnRef.current) {
      // โฟกัสที่ปุ่มปิด เพื่อการเข้าถึงที่ดี
      closeBtnRef.current.focus();
    }
  }, [isModalOpen]);

  const fetchBarcode = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/generate-barcode/${addressId}`,
        { responseType: "arraybuffer" }
      );
      const base64 = arrayBufferToBase64(response.data);
      setBarcodeUrl(`data:image/png;base64,${base64}`);
    } catch (err) {
      console.error("Error fetching barcode:", err);
      setError("ไม่สามารถสร้างบาร์โค้ดได้");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    if (!addressId) return;
    setIsModalOpen(true);
    fetchBarcode();
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setBarcodeUrl(null);
    setError("");
  };

  const handleDownload = () => {
    if (!barcodeUrl) return;
    const a = document.createElement("a");
    a.href = barcodeUrl;
    a.download = `barcode_${addressId}.png`;
    a.click();
  };

  const handlePrint = () => {
    if (!barcodeUrl) return;
    const win = window.open("");
    if (!win) return;
    win.document.write(`
      <html>
        <head><title>พิมพ์บาร์โค้ด</title></head>
        <body style="margin:0;padding:20px;font-family:sans-serif;">
          <div style="text-align:center">
            <img src="${barcodeUrl}" style="max-width:100%;height:auto"/>
            <div style="margin-top:12px">
              <div><strong>บ้านเลขที่:</strong> ${addressInfo?.house_no ?? "-"}</div>
              <div><strong>หมู่ที่:</strong> ${addressInfo?.village_no ?? "-"}</div>
              <div><strong>ถนน/ซอย:</strong> ${addressInfo?.Alley ?? "-"}</div>
              <div><strong>ตำบล:</strong> ${addressInfo?.sub_district ?? "-"}</div>
              <div><strong>อำเภอ:</strong> ${addressInfo?.district ?? "-"}</div>
              <div><strong>จังหวัด:</strong> ${addressInfo?.province ?? "-"}</div>
              <div style="margin-top:8px"><strong>Address ID:</strong> ${addressId}</div>
            </div>
          </div>
          <script>window.onload = () => { window.print(); setTimeout(()=>window.close(), 100); };</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(String(addressId));
      alert("คัดลอก Address ID แล้ว");
    } catch {
      alert("คัดลอกไม่สำเร็จ");
    }
  };

  if (!isVerified) return null; // ซ่อนถ้ายังไม่ยืนยันที่อยู่

  return (
    <div className="barcode-container">
      {/* ปุ่มเปิดโมดัล */}
      <button
        onClick={handleOpen}
        aria-label="ดูบาร์โค้ดที่อยู่"
        className="inline-flex items-center justify-center p-2 rounded-full border hover:bg-gray-50 active:scale-[.98] transition"
        title="ดูบาร์โค้ด"
      >
        <i className="fi fi-ss-barcode-read text-gray-600 text-xl" />
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50"
          aria-modal="true"
          role="dialog"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/40" />

          <div
            className="absolute inset-x-4 top-10 md:inset-x-0 md:mx-auto md:max-w-md bg-white rounded-2xl shadow-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">บาร์โค้ด</h2>
              <button
                ref={closeBtnRef}
                onClick={handleClose}
                aria-label="ปิดหน้าต่างบาร์โค้ด"
                className="rounded-full w-9 h-9 inline-flex items-center justify-center hover:bg-gray-100"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            {/* Body */}
            <div className="mt-4">
              {loading && (
                <div className="text-center py-8 text-gray-500">กำลังสร้างบาร์โค้ด...</div>
              )}

              {!loading && error && (
                <div className="text-center py-6 text-red-600">{error}</div>
              )}

              {!loading && !error && barcodeUrl && (
                <>
                  <div className="flex flex-col items-center">
                    <img
                      src={barcodeUrl}
                      alt="Barcode"
                      className="max-w-full h-auto border rounded-lg p-3"
                    />

                    <div className="mt-4 w-full rounded-lg bg-gray-50 p-3 text-sm">
                      <div className="grid grid-cols-1 gap-1">
                        <div><span className="text-gray-500">บ้านเลขที่:</span> {addressInfo?.house_no ?? "-"}</div>
                        <div><span className="text-gray-500">หมู่ที่:</span> {addressInfo?.village_no ?? "-"}</div>
                        <div><span className="text-gray-500">ถนน/ซอย:</span> {addressInfo?.Alley ?? "-"}</div>
                        <div><span className="text-gray-500">ตำบล:</span> {addressInfo?.sub_district ?? "-"}</div>
                        <div><span className="text-gray-500">อำเภอ:</span> {addressInfo?.district ?? "-"}</div>
                        <div><span className="text-gray-500">จังหวัด:</span> {addressInfo?.province ?? "-"}</div>
                        <div className="mt-1"><span className="text-gray-500">Address ID:</span> {addressId}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex flex-wrap gap-2 justify-end">
                    <button
                      onClick={handleCopyId}
                      className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      คัดลอก ID
                    </button>
                    <button
                      onClick={handleDownload}
                      className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      ดาวน์โหลด PNG
                    </button>
                    <button
                      onClick={handlePrint}
                      className="rounded-lg bg-green-600 text-white px-3 py-2 text-sm hover:bg-green-700"
                    >
                      พิมพ์
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

GenerateBarcode.propTypes = {
  addressId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  status: PropTypes.oneOfType([PropTypes.number, PropTypes.bool, PropTypes.string]).isRequired,
  addressInfo: PropTypes.shape({
    house_no: PropTypes.string,
    village_no: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    Alley: PropTypes.string,
    sub_district: PropTypes.string,
    district: PropTypes.string,
    province: PropTypes.string,
  }).isRequired,
};

export default GenerateBarcode;
