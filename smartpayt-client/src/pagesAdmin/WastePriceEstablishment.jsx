import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import nanglaeIcon from "../assets/img/nanglaeicon.png";
import axios from 'axios';

const WastePriceEstablishment = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isBillDropdownOpen, setIsBillDropdownOpen] = useState(false);
    const [isVerifyDropdownOpen, setIsVerifyDropdownOpen] = useState(false);
    const [isWasteDropdownOpen, setIsWasteDropdownOpen] = useState(true);
    const [selectedWasteType, setSelectedWasteType] = useState('establishment'); // สถานะสำหรับการเลือกขยะ

    const [prices, setPrices] = useState({
        general: '',
        hazardous: '',
        recyclable: '',
        organic: '',
    });
    const [status, setStatus] = useState('');
    const navigate = useNavigate();

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleChange = (type, value) => {
        setPrices({
            ...prices,
            [type]: parseFloat(value),
        });
    };

    const handleSave = async () => {
    const token = localStorage.getItem('Admin_token');
    if (!token) {
        console.error('❌ ไม่พบ token ใน localStorage');
        setStatus('ไม่ได้เข้าสู่ระบบ กรุณา login ใหม่');
        return;
    }

    const wasteType = selectedWasteType === 'household' ? 'household' : 'establishment';

    try {
        const response = await axios.post(`http://localhost:3000/admin/${wasteType}`, 
            { 
                ...prices, 
                waste_type: wasteType // ส่ง waste_type ไปด้วย
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        setStatus('บันทึกสำเร็จ');
    } catch (err) {
        console.error('❌ Error while saving waste pricing:', err.response?.data || err.message);
        setStatus('เกิดข้อผิดพลาดในการบันทึก');
    }
};

    return (
        <div className="flex flex-col min-h-screen bg-[#FDEFB2]">
            {/* Header Bar */}
            <div className="flex items-center justify-between p-4 bg-white shadow">
                <div className="flex items-center">
                    <button onClick={toggleSidebar} className="text-gray-800 p-2 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>

                    <div className="flex items-center space-x-3">
                        <img src={nanglaeIcon} alt="icon" className="h-20" />
                        <h2 className="text-2xl font-bold text-gray-800">เทศบาลตำบลนางแล</h2>
                    </div>
                </div>
            </div>

            <div className="flex h-[calc(100vh-88px)]">
                {/* Sidebar */}
                <div className={`relative ${isSidebarOpen ? "w-1/5" : "w-0 opacity-0"} bg-green-700 p-5 text-white transition-all`}>
                    <h2 className="text-xl font-bold mb-4">Smart Payt</h2>
                    <ul>
                        <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin')}>หน้าหลัก</li>
                        <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin/service')}> ข้อมูลผู้ใช้บริการ </li>
                         <li
                            className="mb-2 px-4 py-3 hover:bg-[#8A9A5B] cursor-pointer rounded"
                            onClick={() => setIsBillDropdownOpen(!isBillDropdownOpen)}
                        >
                            <div className="flex justify-between items-center">
                                <span>ตรวจสอบบิลชำระ</span>
                                <svg
                                    className={`h-4 w-4 transform transition-transform ${isBillDropdownOpen ? "rotate-90" : ""
                                        }`}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </li>

                        {isBillDropdownOpen && (
                            <ul className="ml-4">
                                <li
                                    className="mb-2 px-4 py-3 hover:bg-[#8A9A5B] cursor-pointer rounded"
                                    onClick={() => navigate("/admin/debt")}
                                >
                                    ข้อมูลผู้ค้างชำระค่าบริการ
                                </li>
                                <li
                                    className="mb-2 px-4 py-3 hover:bg-[#8A9A5B] cursor-pointer rounded"
                                    onClick={() => navigate("/admin/payment-slips")}
                                >
                                    ตรวจสอบสลิป
                                </li>
                            </ul>
                        )}
                        <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => setIsVerifyDropdownOpen(!isVerifyDropdownOpen)}>
                            <div className="flex justify-between items-center">
                                <span>ยืนยันสถานะผู้ใช้บริการ</span>
                                <svg className={`h-4 w-4 transform transition-transform ${isVerifyDropdownOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </li>

                        {isVerifyDropdownOpen && (
                            <ul className="ml-4">
                                <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin/verified-user')}>ยืนยันข้อมูลผู้ใช้บริการ</li>
                                <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin/verified-address')}>ยืนยันข้อมูลครัวเรือน</li>
                            </ul>
                        )}
                        <li
                            className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                            onClick={() => setIsWasteDropdownOpen(!isWasteDropdownOpen)}
                        >
                            <div className="flex justify-between items-center">
                                <span>การจัดการบิลและขยะ</span>
                                <svg
                                    className={`h-4 w-4 transform transition-transform ${isWasteDropdownOpen ? 'rotate-90' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </li>

                        {isWasteDropdownOpen && (
                            <ul className="ml-4">
                                <li
                                    className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                                    onClick={() => navigate('/admin/bills')}
                                >
                                    สร้างใบแจ้งหนี้
                                </li>
                                <li
                                    className="mb-2 p-2 bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                                    onClick={() => navigate('/admin/editwaste')}
                                >
                                    กำหนดราคาประเภทขยะ
                                </li>
                            </ul>
                        )}
                        <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3" onClick={() => navigate('/admin/report')}>รายงาน</li>
                    </ul>
                    <div className="absolute bottom-5 left-0 right-0 flex justify-center">
                        <button className="bg-yellow-500 text-black px-7 py-3 rounded shadow-md" onClick={() => {
                            localStorage.removeItem("Admin_token");
                            navigate('/adminlogin');
                        }}>ออกจากระบบ</button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-5">
                    <h1 className="text-3xl font-bold mb-6 text-center lg:text-left">ตั้งค่าราคาค่าบริการขยะแต่ละประเภท (บาท/กิโลกรัม)</h1>

                    <div className="bg-white p-6 rounded-xl shadow-md max-w-xl mx-auto">
                        {/* แถบเลือกประเภทขยะ */}
                <div className="flex mb-5 justify-start gap-4">
                    <button
                    onClick={() => navigate('/admin/household')}
                    className={`px-8 py-3 text-lg font-semibold rounded-full text-white ${selectedWasteType === 'household' ? 'bg-green-600' : 'bg-gray-400'}`}>
                        ครัวเรือน
                        </button>
                        <button
                        onClick={() => navigate('/admin/establishment')}
                        className={`px-8 py-3 text-lg font-semibold rounded-full text-white ${selectedWasteType === 'establishment' ? 'bg-green-600' : 'bg-gray-400'}`}>
                            สถานประกอบการ
                            </button>
                            </div>
                        {[{ key: 'general', label: 'ขยะทั่วไป' }, { key: 'hazardous', label: 'ขยะอันตราย' }, { key: 'recyclable', label: 'ขยะรีไซเคิล (ใส่ค่าติดลบได้)' }, { key: 'organic', label: 'ขยะเปียก' },].map(({ key, label }) => (
                            <div className="mb-5" key={key}>
                                <label className="block mb-1 font-semibold text-gray-700">{label}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={prices[key]}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        ))}

                        <div className="text-sm text-gray-500 mt-2">* ราคาติดลบใช้กรณีรับซื้อขยะรีไซเคิล</div>

                        <button onClick={handleSave} className="mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded">
                            บันทึกการตั้งค่า
                        </button>

                        {status && <p className="mt-3 text-center text-sm text-blue-600">{status}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WastePriceEstablishment;
