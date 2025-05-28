import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import nanglaeIcon from "../assets/img/nanglaeicon.png";

const AdminManualBill = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [wasteWeights, setWasteWeights] = useState({ general: '', hazardous: '', recyclable: '' });
  const [wastePrices, setWastePrices] = useState({ general: 0, hazardous: 0, recyclable: 0 });
  const [totalPrice, setTotalPrice] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const wasteTypes = [
    { key: 'general', label: 'ขยะทั่วไป' },
    { key: 'hazardous', label: 'ขยะอันตราย' },
    { key: 'recyclable', label: 'ขยะรีไซเคิล' },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('Admin_token');
    if (!token) {
      navigate('/adminlogin');
      return;
    }

    axios.get('http://localhost:3000/admin/users', {
      headers: {
        'Cache-Control': 'no-cache',
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(res => setUsers(res.data.users || []))
      .catch(err => setError('ไม่สามารถโหลดผู้ใช้ได้'));

    axios.get('http://localhost:3000/admin/waste-pricing', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => setWastePrices(res.data || {}))
      .catch(err => console.error('Error loading pricing'));
  }, []);

  const handleUserSelect = async (lineUserId, userName) => {
    setSelectedUser(lineUserId);
    setSearchTerm(`${userName} (${lineUserId})`);
    const token = localStorage.getItem('Admin_token');

    try {
      const res = await axios.get(`http://localhost:3000/admin/users/address/${lineUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAddresses(res.data.addresses || []);
    } catch (err) {
      setError('ไม่สามารถโหลดที่อยู่ได้');
    }
  };

  useEffect(() => {
    const g = parseFloat(wasteWeights.general || 0);
    const h = parseFloat(wasteWeights.hazardous || 0);
    const r = parseFloat(wasteWeights.recyclable || 0);

    const total = (g * wastePrices.general) + (h * wastePrices.hazardous) + (r * wastePrices.recyclable);
    setTotalPrice(total.toFixed(2));
  }, [wasteWeights, wastePrices]);

  const handleSubmit = async () => {
    const token = localStorage.getItem('Admin_token');
    if (!selectedAddress || totalPrice <= 0 || !dueDate) {
      setError('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    try {
      await axios.post('http://localhost:3000/admin/bills', {
        address_id: selectedAddress,
        amount_due: parseFloat(totalPrice),
        due_date: dueDate,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('สร้างบิลสำเร็จ');
      setError('');
    } catch (err) {
      setError('ไม่สามารถสร้างบิลได้');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white shadow">
        <div className="flex items-center">
          <button onClick={toggleSidebar} className="text-gray-800 p-2 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center space-x-3">
            <img src={nanglaeIcon} alt="nanglaeIcon" className="h-20" />
            <h2 className="text-2xl font-bold text-gray-800">เทศบาลตำบลนางแล</h2>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-88px)]">
        {/* Sidebar */}
        <div className={`relative ${isSidebarOpen ? "w-1/5" : "w-0 opacity-0"} bg-green-700 p-5 text-white transition-all`}>
          <h2 className="text-xl font-bold mb-4">Smart Payt</h2>
          <ul>
            <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3" onClick={() => navigate('/admin')}>หน้าหลัก</li>
            <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3" onClick={() => navigate('/admin/service')}>ข้อมูลผู้ใช้บริการ</li>
            <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3" onClick={() => navigate('/admin/debt')}>ข้อมูลผู้ค้างชำระค่าบริการ</li>
           <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                <div className="flex justify-between items-center">
                                    <span>ยืนยันสถานะผู้ใช้บริการ</span>
                                    <svg className={`h-4 w-4 transform transition-transform ${isDropdownOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </li>

                            {isDropdownOpen && (
                                <ul className="ml-4">
                                    <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin/verified-user')}>ยืนยันข้อมูลผู้ใช้บริการ</li>
                                    <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin/verified-address')}>ยืนยันข้อมูลครัวเรือน</li>
                                </ul>
                            )}
            <li className="mb-2 p-2 bg-green-900 cursor-pointer px-4 py-3 rounded w-full">เพิ่มบิลชำระให้ผู้บริการ</li>
            <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin/editwaste')}>ตั้งค่าการเก็บขยะแต่ละประเภท</li>
            <div className="absolute bottom-5 left-0 right-0 flex justify-center">
              <button className="bg-yellow-500 text-black px-7 py-3 rounded shadow-md max-w-[90%]" onClick={() => {
                localStorage.removeItem("Admin_token");
                navigate("/adminlogin");
              }}>
                ออกจากระบบ
              </button>
            </div>
          </ul>
        </div>

        {/* Content */}
        <div className="flex-1 p-5">
          <h1 className="text-3xl font-bold mb-6">สร้างบิลค่าบริการ</h1>

          {error && <p className="text-red-500 mb-4">{error}</p>}
          {success && <p className="text-green-500 mb-4">{success}</p>}

          <div className="bg-white p-6 rounded shadow-md space-y-4">
            <div>
              <label className="block mb-1">ค้นหาผู้ใช้:</label>
              <input
                type="text"
                placeholder="พิมพ์ชื่อ"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSearchKeyword(e.target.value);
                  setShowDropdown(true);
                }}
                className="w-full border px-4 py-2 rounded mb-2"
              />
              {showDropdown && searchKeyword.trim().length > 0 && (() => {
                const keyword = searchKeyword.toLowerCase().trim();
                const filteredUsers = users.filter(user =>
                  user.name.toLowerCase().includes(keyword)
                );
                return filteredUsers.length > 0 ? (
                  <ul className="border rounded max-h-40 overflow-y-auto bg-white shadow">
                    {filteredUsers.map(user => (
                      <li
                        key={user.lineUserId}
                        className={`p-2 cursor-pointer hover:bg-gray-100 ${selectedUser === user.lineUserId ? 'bg-gray-200' : ''}`}
                        onClick={() => {
                          handleUserSelect(user.lineUserId, user.name);
                          setSearchTerm(user.name);
                          setSearchKeyword('');
                          setShowDropdown(false);
                        }}
                      >
                        {user.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-red-500 mt-1">ไม่มีรายชื่อผู้ใช้บริการ</p>
                );
              })()}
            </div>

            <div>
              <label className="block mb-1">เลือกบ้าน/ที่อยู่:</label>
              <select onChange={(e) => setSelectedAddress(e.target.value)} className="w-full border px-4 py-2 rounded">
                <option value="">เลือกที่อยู่</option>
                {addresses.map(addr => (
                  <option key={addr.address_id} value={addr.address_id}>{addr.house_no}, {addr.sub_district}, {addr.district}</option>
                ))}
              </select>
            </div>

            {wasteTypes.map(({ key, label }) => (
              <div key={key}>
                <label className="block mb-1">น้ำหนักขยะประเภท {label} (กิโลกรัม):</label>
                <input
                  type="number"
                  value={wasteWeights[key]}
                  onChange={(e) => setWasteWeights({ ...wasteWeights, [key]: e.target.value })}
                  className="w-full border px-4 py-2 rounded"
                />
              </div>
            ))}

            <div>
              <label className="block mb-1">รวมเงิน (บาท):</label>
              <input type="text" value={totalPrice} disabled className="w-full border px-4 py-2 rounded bg-gray-100" />
            </div>

            <div>
              <label className="block mb-1">วันครบกำหนด:</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full border px-4 py-2 rounded" />
            </div>

            <button onClick={handleSubmit} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
              สร้างใบแจ้งหนี้
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminManualBill;
