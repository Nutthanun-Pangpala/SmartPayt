import axios from 'axios';
import th from 'date-fns/locale/th';
import { forwardRef, useEffect, useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from 'react-router-dom';

// ✅ เพิ่ม AdminLayout
import AdminLayout from '../pagesAdmin/component/AdminLayout';

registerLocale('th', th);

// Custom Input (เหมือนเดิม)
const CustomInputWithBuddhistYear = forwardRef(({ value, onClick }, ref) => {
  const convertToBuddhistYear = (dateStr) => {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('/');
    const buddhistYear = (parseInt(year) + 543).toString();
    return `${day}/${month}/${buddhistYear}`;
  };

  return (
    <input
      className="w-full border px-4 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 shadow-sm"
      onClick={onClick}
      ref={ref}
      value={value ? convertToBuddhistYear(value) : ''}
      readOnly
      placeholder="เลือกวันครบกำหนด"
    />
  );
});


const AdminManualBill = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [wasteWeights, setWasteWeights] = useState({ general: '', hazardous: '', recyclable: '', organic: '' });
  const [wastePrices, setWastePrices] = useState({ general: 0, hazardous: 0, recyclable: 0, organic: 0 });
  const [totalPrice, setTotalPrice] = useState('0.00'); // เปลี่ยนเป็น String เพื่อการแสดงผล
  const [dueDate, setDueDate] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAddressType, setSelectedAddressType] = useState('household');
  const [loading, setLoading] = useState(false);


  const wasteTypes = [
    { key: 'general', label: 'ขยะทั่วไป', color: 'bg-blue-100 text-blue-700' },
    { key: 'hazardous', label: 'ขยะอันตราย', color: 'bg-red-100 text-red-700' },
    { key: 'recyclable', label: 'ขยะรีไซเคิล', color: 'bg-green-100 text-green-700' },
    { key: 'organic', label: 'ขยะเปียก', color: 'bg-yellow-100 text-yellow-700' },
  ];
  
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

  // 1. โหลดผู้ใช้ทั้งหมด
  useEffect(() => {
    const token = localStorage.getItem('Admin_token');
    if (!token) { navigate('/adminlogin'); return; }

    axios.get(`${API_BASE_URL}/admin/users`, {
      headers: { 'Cache-Control': 'no-cache', 'Authorization': `Bearer ${token}`, },
    })
      .then(res => setUsers(res.data.users || []))
      .catch(() => setError('ไม่สามารถโหลดรายชื่อผู้ใช้ได้'));
  }, [navigate, API_BASE_URL]);

  // 2. โหลดราคาตามประเภทที่อยู่
  const fetchPricesByAddressType = async (type) => {
    const token = localStorage.getItem('Admin_token');
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/waste-pricing?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWastePrices(res.data || {});
    } catch (err) {
      console.error('Error loading pricing by type', err);
    }
  };

  useEffect(() => {
    if (selectedAddressType) {
      fetchPricesByAddressType(selectedAddressType);
    }
  }, [selectedAddressType, API_BASE_URL]);

  // 3. จัดการการเลือกผู้ใช้
  const handleUserSelect = async (lineUserId, userName) => {
    setLoading(true);
    setError('');
    setSelectedUser(lineUserId);
    setSearchTerm(userName);
    setShowDropdown(false);
    
    const token = localStorage.getItem('Admin_token');
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/users/address/${lineUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAddresses(res.data.addresses || []);
      setSelectedAddress(''); // รีเซ็ตที่อยู่
    } catch (err) {
      setError('ไม่สามารถโหลดที่อยู่ของผู้ใช้ได้');
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  // 4. คำนวณราคารวม
  useEffect(() => {
    const g = parseFloat(wasteWeights.general || 0);
    const h = parseFloat(wasteWeights.hazardous || 0);
    const r = parseFloat(wasteWeights.recyclable || 0);
    const o = parseFloat(wasteWeights.organic || 0);

    const total = (g * wastePrices.general) + 
                  (h * wastePrices.hazardous) + 
                  (r * wastePrices.recyclable) + 
                  (o * wastePrices.organic);
    setTotalPrice(total.toFixed(2));
  }, [wasteWeights, wastePrices]);

  // 5. ส่งบิล
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('Admin_token');
    if (!selectedAddress || !dueDate) {
      setError('กรุณาเลือกที่อยู่และวันครบกำหนด');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/admin/bills`, {
        address_id: selectedAddress,
        generalWeight: parseFloat(wasteWeights.general || 0),
        hazardousWeight: parseFloat(wasteWeights.hazardous || 0),
        recyclableWeight: parseFloat(wasteWeights.recyclable || 0),
        organicWeight: parseFloat(wasteWeights.organic || 0),
        due_date: dueDate ? dueDate.toISOString().split('T')[0] : '',
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const finalAmount = response.data?.bill?.amount_due || response.data?.amount_due;
      if (finalAmount) {
        setTotalPrice(parseFloat(finalAmount).toFixed(2));
      }

      setSuccess(`สร้างบิลสำเร็จ! เลขที่บิล: ${response.data.bill_id || 'N/A'}`);
      // รีเซ็ตฟอร์ม (ยกเว้น selectedUser)
      setAddresses([]);
      setSelectedAddress('');
      setWasteWeights({ general: '', hazardous: '', recyclable: '', organic: '' });
      setDueDate(null); 
    } catch (err) {
      const msg = err.response?.data?.message || 'ไม่สามารถสร้างบิลได้: เกิดข้อผิดพลาด';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <AdminLayout>
      <div className="bg-gray-50 min-h-full p-4 sm:p-6">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6 border-b-2 border-green-500 pb-2">
          สร้างใบแจ้งหนี้ (Manual)
        </h1>

        {/* --- Alert Messages --- */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md" role="alert">
            <p className="font-bold">เกิดข้อผิดพลาด</p>
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-md" role="alert">
            <p className="font-bold">ดำเนินการสำเร็จ</p>
            <p>{success}</p>
          </div>
        )}

        {/* --- Main Grid Layout --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* -------------------------------------
            COLUMN 1: User & Address Selection
          ------------------------------------- */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* 1. Card: ค้นหาผู้ใช้ */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 relative">
              <h2 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-2">1. ค้นหาผู้รับบิล</h2>
              
              <label className="block mb-2 text-sm font-medium text-gray-700">ชื่อผู้ใช้ / Line ID:</label>
              <input
                type="text"
                placeholder="พิมพ์ชื่อหรือ Line ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSearchKeyword(e.target.value);
                  setShowDropdown(true);
                }}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />

              {/* Dropdown Results */}
              {showDropdown && searchKeyword.trim().length > 0 && (() => {
                const keyword = searchKeyword.toLowerCase().trim();
                const filteredUsers = users.filter(user =>
                  user.name.toLowerCase().includes(keyword) || (user.lineUserId || '').includes(keyword)
                );
                return filteredUsers.length > 0 ? (
                  // ใช้ absolute position เพื่อให้ Dropdown ทับเนื้อหาอื่น
                  <ul className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-xl z-20">
                    {filteredUsers.map(user => (
                      <li
                        key={user.lineUserId}
                        className="p-3 cursor-pointer hover:bg-blue-50 transition duration-150 border-b border-gray-100"
                        onClick={() => handleUserSelect(user.lineUserId, user.name)}
                      >
                        <p className="font-medium text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-500">ID: {user.lineUserId}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-red-500 mt-2 p-2">ไม่พบรายชื่อผู้ใช้บริการ</p>
                );
              })()}
              
              {selectedUser && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
                  <p className="font-semibold text-blue-800">ผู้ใช้ที่เลือก:</p>
                  <p className="text-blue-700">{searchTerm}</p>
                </div>
              )}
            </div>

            {/* 2. Card: เลือกที่อยู่ */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-2">2. เลือกที่อยู่ (ที่ต้องการออกบิล)</h2>
              
              <label className="block mb-2 text-sm font-medium text-gray-700">ที่อยู่:</label>
              <select
                value={selectedAddress}
                onChange={(e) => {
                  const selectedId = parseInt(e.target.value);
                  const selected = addresses.find(a => a.address_id === selectedId);
                  setSelectedAddress(e.target.value);
                  setSelectedAddressType(selected?.address_type || 'household'); 
                }}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                disabled={!selectedUser || addresses.length === 0 || loading}
              >
                <option value="">เลือกที่อยู่</option>
                {addresses.map(addr => (
                  <option key={addr.address_id} value={addr.address_id}>
                    {addr.house_no}, {addr.sub_district} ({addr.address_type === 'household' ? 'ครัวเรือน' : 'ธุรกิจ'})
                  </option>
                ))}
              </select>
              
              {selectedAddress && (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md text-xs">
                  <p className="font-semibold text-green-800">ประเภทราคาที่ใช้:</p>
                  <p className="text-green-700">{selectedAddressType === 'household' ? 'ครัวเรือน' : 'สถานประกอบการ'}</p>
                </div>
              )}
            </div>

            {/* 3. Card: กำหนดวันครบกำหนด */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-2">3. กำหนดวันครบกำหนด</h2>
              <DatePicker
                selected={dueDate}
                onChange={(date) => setDueDate(date)}
                dateFormat="dd/MM/yyyy"
                locale="th"
                customInput={<CustomInputWithBuddhistYear />}
                placeholderText="คลิกเพื่อเลือกวันที่"
                // ... (renderCustomHeader เหมือนเดิม) ...
                renderCustomHeader={({
                  date,
                  changeYear,
                  changeMonth,
                  decreaseMonth,
                  increaseMonth,
                  prevMonthButtonDisabled,
                  nextMonthButtonDisabled,
                }) => {
                  const years = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - 10 + i);
                  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
                    return (
                      <div className="flex justify-between items-center px-2 py-1 bg-gray-100 rounded-t">
                        <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled} className="p-1 hover:bg-gray-300 rounded">{'<'}</button>
                        <select value={date.getFullYear()} onChange={({ target: { value } }) => changeYear(value)} className="border rounded p-1 text-sm">
                          {years.map((year) => (
                            <option key={year} value={year}>{year + 543}</option>
                          ))}
                        </select>
                        <select value={date.getMonth()} onChange={({ target: { value } }) => changeMonth(value)} className="border rounded p-1 text-sm">
                          {months.map((month, index) => (
                            <option key={month} value={index}>{month}</option>
                        ))}
                      </select>
                      <button onClick={increaseMonth} disabled={nextMonthButtonDisabled} className="p-1 hover:bg-gray-300 rounded">{'>'}</button>
                    </div>
                  );
                }}
              />
            </div>

          </div>

          {/* -------------------------------------
            COLUMN 2 & 3: Waste Weights & Total
          ------------------------------------- */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 4. Card: รายละเอียดน้ำหนักขยะ */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">4. บันทึกน้ำหนักขยะ (กิโลกรัม)</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {wasteTypes.map(({ key, label, color }) => {
                  const weight = parseFloat(wasteWeights[key] || 0);
                  const pricePerKg = parseFloat(wastePrices[key] || 0);
                  const subtotal = (weight * pricePerKg).toFixed(2);
                  return (
                    <div key={key} className={`p-4 rounded-lg border ${color.includes('bg-red') ? 'border-red-300' : color.includes('bg-green') ? 'border-green-300' : 'border-blue-300'}`}>
                      <label className="block mb-1 font-semibold text-gray-800">
                        {label} 
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={wasteWeights[key]}
                        onChange={(e) => setWasteWeights({ ...wasteWeights, [key]: e.target.value })}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                      <div className="mt-2 text-sm">
                        <p className="text-gray-600">ราคา/กก.: <b>{pricePerKg.toFixed(2)}</b> บาท</p>
                        <p className="font-bold text-gray-800">รวม: {subtotal} บาท</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Card: สรุปราคารวมและปุ่ม */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h2 className="text-xl font-semibold text-gray-700">5. สรุปและสร้างบิล</h2>
                <div className="text-3xl font-extrabold text-blue-700">
                  {totalPrice} ฿
                </div>
              </div>
              
              <label className="block mb-2 text-sm font-medium text-gray-700">ยอดรวมทั้งหมด (บาท):</label>
              <input 
                type="text" 
                value={totalPrice} 
                disabled 
                className="w-full border-2 border-blue-500 px-4 py-3 rounded-lg bg-blue-50 text-2xl font-bold text-blue-800 shadow-inner mb-4" 
              />
              
              <button 
                onClick={handleSubmit} 
                disabled={loading || !selectedAddress || !dueDate}
                className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition duration-200 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'กำลังสร้างใบแจ้งหนี้...' : '✅ ยืนยันและสร้างใบแจ้งหนี้'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminManualBill;