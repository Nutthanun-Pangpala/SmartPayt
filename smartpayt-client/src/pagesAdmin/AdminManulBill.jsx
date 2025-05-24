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
  const [amountDue, setAmountDue] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);


  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const token = localStorage.getItem('Admin_token');
    if (!token) {
      navigate('/adminlogin');
      return;
    }

    axios.get('http://localhost:3000/admin/users', {
      headers: { admin_token: token }
    })
    .then(res => setUsers(res.data.users || []))
    .catch(err => setError('ไม่สามารถโหลดผู้ใช้ได้'));
  }, []);

  const handleUserSelect = async (lineUserId, userName) => {
    setSelectedUser(lineUserId);
    setSearchTerm(`${userName} (${lineUserId})`);
    const token = localStorage.getItem('Admin_token');

    try {
      const res = await axios.get(`http://localhost:3000/admin/users/address/${lineUserId}`, {
        headers: { admin_token: token } 
      });
      setAddresses(res.data.addresses || []);
    } catch (err) {
      setError('ไม่สามารถโหลดที่อยู่ได้');
    }
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('Admin_token');
    if (!selectedAddress || !amountDue || !dueDate) {
      setError('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
//co
    try {
      await axios.post('http://localhost:3000/admin/bills', {
        address_id: selectedAddress,
        amount_due: parseFloat(amountDue),
        due_date: dueDate, 
}, {
  headers: { admin_token: token }
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
            <li className="mb-2 p-2 bg-green-900 cursor-pointer px-4 py-3 rounded w-full">Manual Bill</li>
            <div className="absolute bottom-5 left-0 right-0 flex justify-center">
              <button
                className="bg-yellow-500 text-black px-7 py-3 rounded shadow-md max-w-[90%]"
                onClick={() => {
                  localStorage.removeItem("token");
                  navigate("/adminlogin");
                }}
              >
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
    setSearchTerm(e.target.value);     // สำหรับโชว์ในช่อง
    setSearchKeyword(e.target.value);  // สำหรับค้นหา
    setShowDropdown(true);             // แสดง dropdown
  }}
  className="w-full border px-4 py-2 rounded mb-2"
/>

  {/* คำนวณ filteredUsers แยกไว้ก่อน */}
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
          className={`p-2 cursor-pointer hover:bg-gray-100 ${
            selectedUser === user.lineUserId ? 'bg-gray-200' : ''
          }`}
          onClick={() => {
            handleUserSelect(user.lineUserId, user.name);
            setSearchTerm(user.name);     // ✅ โชว์ชื่ออย่างเดียว
            setSearchKeyword('');         // ✅ หยุด filter
            setShowDropdown(false);       // ✅ ปิด dropdown
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

            <div>
              <label className="block mb-1">จำนวนเงินที่ต้องชำระ:</label>
              <input type="number" value={amountDue} onChange={(e) => setAmountDue(e.target.value)} className="w-full border px-4 py-2 rounded" />
            </div>

            <div>
              <label className="block mb-1">วันครบกำหนด:</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full border px-4 py-2 rounded" />
            </div>

            <button onClick={handleSubmit} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
              ยิงบิล
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminManualBill;
