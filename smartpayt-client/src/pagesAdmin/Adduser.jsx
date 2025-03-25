import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AddUser = () => {
  const [formData, setFormData] = useState({
    lineUserId: '',
    name: '',
    ID_card_No: '',
    Phone_No: '',
    Email: '',
    Home_ID: '',
    Address: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
        if (!formData.ID_card_No || !formData.Phone_No) {
            setError('กรุณากรอกข้อมูลเลขบัตรประชาชนและเบอร์โทรศัพท์');
            return;
        }

        const response = await axios.post('http://localhost:3000/api/register', formData);
        console.log('API Response:', response.data);  // ดูว่ามี error หรือเปล่า
        setSuccess('เพิ่มข้อมูลผู้ใช้สำเร็จ');
        
        setFormData({
            lineUserId: '',
            name: '',
            ID_card_No: '',
            Phone_No: '',
            Email: '',
            Home_ID: '',
            Address: ''
        });

        navigate('/user');  // เด้งกลับไปทันที

    } catch (err) {
        console.error('Error adding user:', err);
        setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลผู้ใช้');
    }
};


  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-4 bg-white shadow">
        <div className="flex items-center">
          <div className="mr-2">
            <button onClick={toggleSidebar} className="text-gray-800 p-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-800">เทศบาลตำบลนางแล</h2>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Admin</p>
          </div>
        </div>
      </div>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className={`relative ${isSidebarOpen ? "w-1/5" : "w-0 opacity-0"} bg-green-700 p-5 text-white transition-all duration-300 ease-in-out overflow-hidden`}>
          <div className={`${isSidebarOpen ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}>
            <h2 className="text-xl font-bold mb-4">Smart Payt</h2>
            <ul>
              <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                onClick={() => navigate('/main')}> หน้าหลัก </li>

              <li className="mb-2 p-2 bg-green-900 cursor-pointer px-4 py-3 rounded w-full"
                onClick={() => navigate('/user')}>ข้อมูลผู้ใช้บริการ</li>

              <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                onClick={() => navigate('/ostp')}> ข้อมูลผู้ค้างชำระค่าบริการ </li>
            </ul>
            <div className="relative flex justify-center items-center h-screen bg-green-700">
              <button className="bg-yellow-500 text-black px-7 py-3 rounded shadow-md max-w-[90%]"
                onClick={() => navigate('/adminlogin')}> ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className={`flex-1 p-5 transition-all duration-300 ease-in-out ${isSidebarOpen ? "ml-1/5" : "lg:w-4/5 w-full ml-0"}`}>
          <h1 className="text-3xl font-bold mb-6 text-center lg:text-left">เพิ่มข้อมูลผู้ใช้บริการ</h1>
          
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
          {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
          
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lineUserID">
                LINE User ID
              </label>
              <input
                type="text"
                id="lineUserId"
                name="lineUserId"
                value={formData.lineUserId}
                onChange={handleChange}
                placeholder="กรุณากรอก LINE User ID"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="NAME">
                ชื่อ-นามสกุล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="กรุณากรอกชื่อ-นามสกุล"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ID_card_No">
                เลขบัตรประชาชน <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="ID_card_No"
                name="ID_card_No"
                value={formData.ID_card_No}
                onChange={handleChange}
                placeholder="กรุณากรอกเลขบัตรประชาชน 13 หลัก"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                maxLength="13"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="Phone_No">
                เบอร์โทรศัพท์ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="Phone_No"
                name="Phone_No"
                value={formData.Phone_No}
                onChange={handleChange}
                placeholder="กรุณากรอกเบอร์โทรศัพท์ 10 หลัก"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                maxLength="10"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="Email">
                อีเมล
              </label>
              <input
                type="email"
                id="Email"
                name="Email"
                value={formData.Email}
                onChange={handleChange}
                placeholder="กรุณากรอกอีเมล"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="Home_ID">
                รหัสบ้าน
              </label>
              <input
                type="text"
                id="Home_ID"
                name="Home_ID"
                value={formData.Home_ID}
                onChange={handleChange}
                placeholder="กรุณากรอกรหัสบ้าน"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="Address">
                ที่อยู่
              </label>
              <textarea
                id="Address"
                name="Address"
                value={formData.Address}
                onChange={handleChange}
                placeholder="กรุณากรอกที่อยู่"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-green-700 hover:bg-green-900 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                เพิ่มข้อมูล
              </button>
              <button
                type="button"
                onClick={() => navigate('/user')}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUser;