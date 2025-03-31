import axios from "axios";
import { Buffer } from "buffer";
import PropTypes from "prop-types";
import { useState } from "react";

const GenerateBarcode = ({ addressId }) => {
  const [barcodeUrl, setBarcodeUrl] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // To control the modal visibility

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
      setIsModalOpen(true); // Open the modal when generating the barcode
    }
  };

  const handleCloseClick = () => {
    setIsModalOpen(false); // Close the modal
    setBarcodeUrl(null); // Reset the barcode URL
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="barcode-container mr-2">
      <button
        onClick={handleGenerateClick}
        className="text-2xl"
      >
       <i className="fi fi-ss-barcode-read text-gray-500"></i>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
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
                <img
                  src={barcodeUrl}
                  alt="Barcode"
                  className="max-w-full h-auto"
                />
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
  addressId: PropTypes.string.isRequired, // Ensure addressId is passed as a string
};

export default GenerateBarcode;
