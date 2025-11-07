import { BrowserMultiFormatReader } from '@zxing/library';
import axios from 'axios';
import th from 'date-fns/locale/th';
import { forwardRef, useEffect, useRef, useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
// ✅ เพิ่ม FaClock เข้าไปในรายการ Import
import { FaBarcode, FaCamera, FaClock, FaSave, FaStop, FaTrash } from 'react-icons/fa';

// ✅ เพิ่ม AdminLayout เข้ามา
import AdminLayout from './component/AdminLayout';

registerLocale('th', th);

// ... (โค้ด CustomInputWithBuddhistYear คงเดิม) ...
const CustomInputWithBuddhistYear = forwardRef(({ value, onClick }, ref) => {
  const convertToBuddhistYear = (dateStr) => {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('/');
    const buddhistYear = (parseInt(year) + 543).toString();
    return `${day}/${month}/${buddhistYear}`;
  };

  return (
    <input
      className="w-full border px-4 py-2 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 transition duration-150"
      onClick={onClick}
      ref={ref}
      value={value ? convertToBuddhistYear(value) : ''}
      readOnly
      placeholder="เลือกวันที่ชั่ง/บันทึก"
    />
  );
});

export default function ScanAndSaveWasteRecordSingleType() {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [selectedType, setSelectedType] = useState('general'); 
  const [weight, setWeight] = useState('');                   
  const [recordedDate, setRecordedDate] = useState(new Date());
  const [wastePrices, setWastePrices] = useState({ general: 0, hazardous: 0, recyclable: 0, organic: 0 }); 
  const [estimatedAmount, setEstimatedAmount] = useState('0.00');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

  // โหลดราคาขยะ (ออปชันสำหรับแสดงผล/คุมตามเรท)
  useEffect(() => {
    const token = localStorage.getItem('Admin_token');
    if (!token) return;
    axios.get(`${API_BASE_URL}/admin/waste-pricing`, { 
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setWastePrices(res.data || {}))
      .catch(err => console.warn('ไม่สามารถโหลดราคาขยะเริ่มต้นได้', err));
  }, [API_BASE_URL]);

  // คำนวณยอดโดยประมาณของรายการนี้ (เพื่อแสดงผล)
  useEffect(() => {
    const w = parseFloat(weight || 0);
    const p = parseFloat(wastePrices[selectedType] || 0);
    setEstimatedAmount((w * p).toFixed(2));
  }, [weight, selectedType, wastePrices]);

  // เริ่มสแกนครั้งเดียว
  const startScanOnce = async () => {
    setMsg({ type: '', text: '' });
    setScannedCode('');
    setScanning(true);

    try {
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      const result = await codeReader.decodeOnceFromVideoDevice(undefined, videoRef.current);
      const code = result?.text?.trim();
      setScannedCode(code || '');
      setScanning(false);
      
      setMsg({ type: 'success', text: `สแกนสำเร็จ! ID บ้านที่: ${code}` });

      try { codeReader.reset(); } catch (e) {}
    } catch (err) {
      console.error('Scan error', err);
      setMsg({ type: 'error', text: 'สแกนไม่สำเร็จ หรือไม่พบกล้อง (โปรดลองใหม่)' });
      setScanning(false);
      if (codeReaderRef.current) {
        try { codeReaderRef.current.reset(); } catch (e) {}
      }
    }
  };

  // หยุดกล้องเมื่อ component ถูก unmount
  useEffect(() => {
    return () => {
      if (codeReaderRef.current) {
        try { codeReaderRef.current.reset(); } catch (e) {}
      }
    };
  }, []);

  // บันทึก 1 เรคอร์ดลง waste_record
  const handleSubmit = async () => {
    setMsg({ type: '', text: '' });

    if (!scannedCode) {
      setMsg({ type: 'error', text: '⚠️ กรุณาสแกนรหัสที่อยู่ก่อน' });
      return;
    }
    const addressId = parseInt(scannedCode, 10);
    if (Number.isNaN(addressId)) {
      setMsg({ type: 'error', text: '⚠️ รหัสที่อยู่ไม่ใช่ตัวเลขที่ถูกต้อง' });
      return;
    }

    if (!selectedType) {
      setMsg({ type: 'error', text: '⚠️ กรุณาเลือกประเภทขยะ' });
      return;
    }

    const w = parseFloat(weight);
    if (Number.isNaN(w) || w <= 0) {
      setMsg({ type: 'error', text: '⚠️ กรุณากรอกน้ำหนักที่มากกว่า 0' });
      return;
    }

    const ymd = recordedDate ? recordedDate.toISOString().split('T')[0] : null;
    const token = localStorage.getItem('Admin_token');
    if (!token) {
      setMsg({ type: 'error', text: '⚠️ ไม่พบ token กรุณาเข้าสู่ระบบ' });
      return;
    }

    const payload = {
      address_id: addressId,
      waste_type: selectedType,  
      weight_kg: w,
      recorded_date: ymd         
    };

    try {
      await axios.post(`${API_BASE_URL}/api/admin/waste-records`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMsg({ type: 'success', text: `✅ บันทึกสำเร็จ: ${selectedType} ${w.toFixed(2)} กก. (ยอด: ${estimatedAmount} บาท)` });
      setWeight(''); // เคลียร์น้ำหนัก
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: `❌ บันทึกไม่สำเร็จ: ${err.response?.data?.message || 'โปรดตรวจสอบข้อมูล'}` });
    }
  };
  
  const wasteTypeLabels = {
    general: 'ขยะทั่วไป',
    hazardous: 'ขยะอันตราย',
    recyclable: 'ขยะรีไซเคิล',
    organic: 'ขยะเปียก/อินทรีย์',
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 bg-gray-50 min-h-full">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6 border-b-2 border-green-500 pb-2">
          <FaCamera className="inline mr-3 text-green-600" /> สแกนและบันทึกน้ำหนักขยะ
        </h1>

        {/* --- Alert Messages --- */}
        {msg.text && (
          <div className={`mb-4 p-4 rounded-lg shadow-md transition-all duration-300 ${msg.type === 'error' ? 'bg-red-100 border-l-4 border-red-500 text-red-700' : 'bg-green-100 border-l-4 border-green-500 text-green-700'}`}>
            <p className="font-medium">{msg.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* -------------------------------------
            COLUMN 1: Scan & Camera Feed
          ------------------------------------- */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2"><FaBarcode className="inline mr-2" /> ขั้นตอนที่ 1: สแกนที่อยู่</h2>
            
            {/* Camera Feed */}
            <div className="mt-4 relative bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-400">
              <video ref={videoRef} id="video" className="w-full" style={{ maxHeight: 360 }} />
              {!scanning && <div className="absolute inset-0 flex items-center justify-center text-white text-lg font-bold bg-black bg-opacity-30">พร้อมสแกน</div>}
            </div>

            {/* Scan Controls */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition duration-150 shadow-md disabled:bg-gray-400"
                onClick={startScanOnce}
                disabled={scanning}
              >
                {scanning ? <FaCamera className="animate-pulse mr-2" /> : <FaCamera className="mr-2" />}
                {scanning ? 'กำลังสแกน...' : 'เริ่มสแกน'}
              </button>
              <button
                className="flex items-center bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition duration-150"
                onClick={() => {
                  if (codeReaderRef.current) {
                    try { codeReaderRef.current.reset(); } catch (e) {}
                    setScanning(false);
                    setMsg({ type: '', text: '' });
                  }
                }}
              >
                <FaStop className="mr-2" /> หยุดกล้อง
              </button>
            </div>

            {/* Scanned Result */}
            {scannedCode && (
              <div className="mt-4 p-3 bg-green-50 border border-green-300 rounded-lg text-lg font-bold text-green-800 flex items-center justify-between">
                <div>ID ที่อยู่: <span className="text-xl">{scannedCode}</span></div>
                <FaBarcode className="text-2xl" />
              </div>
            )}
          </div>

          {/* -------------------------------------
            COLUMN 2: Data Input & Save
          ------------------------------------- */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 space-y-5">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2"><FaSave className="inline mr-2" /> ขั้นตอนที่ 2: บันทึกน้ำหนัก</h2>
            
            {/* 2.1 ประเภทขยะ */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">ประเภทขยะ</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 text-lg"
              >
                {Object.entries(wasteTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label} ({key})</option>
                ))}
              </select>
              <div className="text-sm text-gray-600 mt-1 p-1 bg-gray-100 rounded">
                ราคา/กก. อ้างอิง: <span className="font-bold text-green-700">{(wastePrices[selectedType] || 0).toFixed(2)} บาท</span>
              </div>
            </div>

            {/* 2.2 น้ำหนัก */}
            <div>
              <label className="block mb-2 font-medium text-gray-700"><FaTrash className="inline mr-2" /> น้ำหนัก (กิโลกรัม)</label>
              <input
                type="number"
                step="0.01"
                min={selectedType === 'recyclable' ? undefined : "0"} 
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full border border-gray-300 px-4 py-3 rounded-lg shadow-inner focus:ring-green-500 focus:border-green-500 text-2xl font-bold"
                placeholder="0.00"
              />
            </div>
            
            {/* 2.3 วันที่ */}
            <div>
              <label className="block mb-2 font-medium text-gray-700"><FaClock className="inline mr-2" /> วันที่ชั่ง/บันทึก</label>
              <DatePicker
                selected={recordedDate}
                onChange={(d) => setRecordedDate(d)}
                dateFormat="dd/MM/yyyy"
                locale="th"
                customInput={<CustomInputWithBuddhistYear />}
              />
            </div>

            {/* 2.4 ยอดโดยประมาณ */}
            <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg">
              <label className="block mb-1 font-medium text-blue-800">ยอดโดยประมาณ (บาท)</label>
              <input
                type="text"
                readOnly
                value={`${estimatedAmount} ฿`}
                className="w-full border-0 px-0 py-0 bg-transparent text-3xl font-extrabold text-blue-900"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-3 border-t">
              <button 
                className="flex-1 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition duration-150 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed" 
                onClick={handleSubmit}
                disabled={!scannedCode || !weight || parseFloat(weight) === 0}
              >
                <FaSave className="inline mr-2" /> บันทึกรายการ
              </button>
              <button
                className="bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 transition duration-150"
                onClick={() => {
                  setWeight('');
                  setMsg({ type: '', text: '' });
                }}
              >
                ล้างน้ำหนัก
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}