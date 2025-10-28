import { BrowserMultiFormatReader } from '@zxing/library';
import axios from 'axios';
import th from 'date-fns/locale/th';
import React, { useEffect, useRef, useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('th', th);

const CustomInputWithBuddhistYear = React.forwardRef(({ value, onClick }, ref) => {
  const convertToBuddhistYear = (dateStr) => {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('/');
    const buddhistYear = (parseInt(year) + 543).toString();
    return `${day}/${month}/${buddhistYear}`;
  };

  return (
    <input
      className="w-full border px-4 py-2 rounded"
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
  const [selectedType, setSelectedType] = useState('general'); // เลือก type ทีละอัน
  const [weight, setWeight] = useState('');                    // น้ำหนักของ type ที่เลือก
  const [recordedDate, setRecordedDate] = useState(new Date());
  const [wastePrices, setWastePrices] = useState({ general: 0, hazardous: 0, recyclable: 0, organic: 0 }); // ใช้โชว์ราคา/กก.
  const [estimatedAmount, setEstimatedAmount] = useState('0.00');
  const [msg, setMsg] = useState({ type: '', text: '' });

  // โหลดราคาขยะ (ออปชันสำหรับแสดงผล/คุมตามเรท)
  useEffect(() => {
    const token = localStorage.getItem('Admin_token');
    if (!token) return;
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/waste-pricing`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        // สมมติ backend คืนโครงสร้างเป็น object key ตามประเภท
        // เช่น { general: 3, hazardous: 10, recyclable: 2, organic: 2.5 }
        setWastePrices(res.data || {});
      })
      .catch(err => console.warn('ไม่สามารถโหลดราคาขยะเริ่มต้นได้', err));
  }, []);

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

      try { codeReader.reset(); } catch (e) {}
    } catch (err) {
      console.error('Scan error', err);
      setMsg({ type: 'error', text: 'สแกนไม่สำเร็จ ลองอีกครั้ง' });
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
      setMsg({ type: 'error', text: 'กรุณาสแกนรหัสที่อยู่ก่อน' });
      return;
    }
    const addressId = parseInt(scannedCode, 10);
    if (Number.isNaN(addressId)) {
      setMsg({ type: 'error', text: 'รหัสที่อยู่ไม่ใช่ตัวเลขที่ถูกต้อง' });
      return;
    }

    if (!selectedType) {
      setMsg({ type: 'error', text: 'กรุณาเลือกประเภทขยะ' });
      return;
    }

    const w = parseFloat(weight);
    if (Number.isNaN(w) || w <= 0) {
      setMsg({ type: 'error', text: 'กรุณากรอกน้ำหนักที่มากกว่า 0' });
      return;
    }

    const ymd = recordedDate ? recordedDate.toISOString().split('T')[0] : null;

    const token = localStorage.getItem('Admin_token');
    if (!token) {
      setMsg({ type: 'error', text: 'ไม่พบ token กรุณาเข้าสู่ระบบ' });
      return;
    }

    const payload = {
      address_id: addressId,
      waste_type: selectedType,  // enum('general','hazardous','recyclable','organic')
      weight_kg: w,
      recorded_date: ymd         // ถ้า DB default curdate() จะส่งหรือไม่ส่งก็ได้
    };

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/waste-records`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMsg({ type: 'success', text: `บันทึกสำเร็จ: ${selectedType} ${w.toFixed(2)} กก. (≈ ${estimatedAmount} บาท)` });
      // เคลียร์เฉพาะน้ำหนักเพื่อพร้อมชั่งรายการถัดไป
      setWeight('');
      // คง selectedType / recordedDate / scannedCode ไว้ เพื่อทำงานต่อเนื่องได้เร็ว
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'บันทึกไม่สำเร็จ' });
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">สแกนบาร์โค้ด แล้วบันทึก (ทีละประเภท)</h2>

      {msg.text && (
        <div className={`mb-4 p-3 rounded ${msg.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {msg.text}
        </div>
      )}

      <div className="bg-white p-4 rounded shadow mb-4">
        <div className="flex items-center gap-3">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={startScanOnce}
            disabled={scanning}
          >
            {scanning ? 'กำลังสแกน...' : 'เริ่มสแกนบาร์โค้ด'}
          </button>
          <button
            className="bg-gray-200 px-3 py-2 rounded"
            onClick={() => {
              if (codeReaderRef.current) {
                try { codeReaderRef.current.reset(); } catch (e) {}
                setScanning(false);
              }
            }}
          >
            หยุด
          </button>
          {scannedCode && <div className="text-sm text-gray-600">ID บ้านที่ : <b>{scannedCode}</b></div>}
        </div>

        <div className="mt-4">
          <video ref={videoRef} id="video" style={{ width: '100%', maxHeight: 360, borderRadius: 6, border: '1px solid #ddd' }} />
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow mb-4">
        <h3 className="font-semibold mb-3">บันทึกน้ำหนัก (หนึ่งประเภทต่อครั้ง)</h3>

        <div className="mb-3">
          <label className="block mb-1">ประเภทขยะ</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="general">ขยะทั่วไป (general)</option>
            <option value="hazardous">ขยะอันตราย (hazardous)</option>
            <option value="recyclable">ขยะรีไซเคิล (recyclable)</option>
            <option value="organic">ขยะเปียก/อินทรีย์ (organic)</option>
          </select>
          <div className="text-xs text-gray-500 mt-1">
            ราคา/กก. อ้างอิง: {(wastePrices[selectedType] || 0).toString()}
          </div>
        </div>

        <div className="mb-3">
          <label className="block mb-1">น้ำหนัก (กก.)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="เช่น 2.50"
          />
        </div>

        <div className="mb-3">
          <label className="block mb-1">วันที่ชั่ง/บันทึก (recorded_date)</label>
          <DatePicker
            selected={recordedDate}
            onChange={(d) => setRecordedDate(d)}
            dateFormat="dd/MM/yyyy"
            locale="th"
            customInput={<CustomInputWithBuddhistYear />}
          />
          <div className="text-xs text-gray-500 mt-1">
            ถ้าไม่เลือก ระบบฐานข้อมูลอาจใช้ค่าเริ่มต้นเป็นวันที่ปัจจุบัน (curdate()) ตามสคีมาของคุณ
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-1">ยอดโดยประมาณ (บาท)</label>
          <input
            type="text"
            readOnly
            value={estimatedAmount}
            className="w-full border px-3 py-2 rounded bg-gray-100"
          />
        </div>

        <div className="flex gap-3">
          <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleSubmit}>
            บันทึก
          </button>
          <button
            className="bg-gray-200 px-4 py-2 rounded"
            onClick={() => {
              setWeight('');
              setMsg({ type: '', text: '' });
              // คงประเภท/วันที่/รหัสที่อยู่ไว้
            }}
          >
            ล้างน้ำหนัก
          </button>
        </div>
      </div>
    </div>
  );
}
