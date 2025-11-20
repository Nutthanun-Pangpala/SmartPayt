import { useEffect, useMemo, useState } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaSearch, FaSpinner, FaTrash } from 'react-icons/fa';
import api from '../api';
import AdminLayout from './component/AdminLayout';

// Debounce Utility
function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

const initialWasteState = {
    address_id: '',
    general: '',
    hazardous: '',
    recyclable: '',
    organic: '',
    recorded_date: new Date().toISOString().slice(0, 10),
};

const AdminManulBill = () => {
    const [formData, setFormData] = useState(initialWasteState);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    
    // STATES สำหรับ Search Suggestion
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null); 
    
    // ✅ NEW STATE: สำหรับเก็บราคาทุกประเภท (เพื่อคำนวณ)
    const [pricing, setPricing] = useState({});
    const [pricingLoading, setPricingLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // บังคับให้เป็นตัวเลขทศนิยม (สำหรับน้ำหนัก)
        if (['general', 'hazardous', 'recyclable', 'organic'].includes(name)) {
            const numValue = value.replace(/[^0-9.]/g, ''); 
            setFormData((prev) => ({ ...prev, [name]: numValue }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    // -----------------------------------------------------
    // ✅ HOOK: ดึงราคาทันทีเมื่อเลือก Address
    // -----------------------------------------------------
    useEffect(() => {
        if (!selectedAddress) {
            setPricing({});
            return;
        }

        const fetchPricing = async () => {
            setPricingLoading(true);
            setError('');
            try {
                // ดึงราคาตามประเภทที่อยู่ (household หรือ establishment)
                const addressType = selectedAddress.address_type || 'household';
                const res = await api.get(`/admin/waste-pricing?group=${addressType}`);
                setPricing(res.data);
            } catch (err) {
                console.error('Error fetching pricing:', err);
                setError('ไม่สามารถดึงข้อมูลราคาขยะได้');
            } finally {
                setPricingLoading(false);
            }
        };

        fetchPricing();
    }, [selectedAddress]);


    // -----------------------------------------------------
    // ✅ USEMEMO: คำนวณยอดรวม Real-time
    // -----------------------------------------------------
    const calculatedTotal = useMemo(() => {
        if (Object.keys(pricing).length === 0) return 0;

        let total = 0;
        const wasteTypes = ['general', 'hazardous', 'recyclable', 'organic'];

        wasteTypes.forEach(type => {
            const weight = parseFloat(formData[type]) || 0;
            const pricePerKg = pricing[type] || 0; // ใช้ pricing ที่ดึงมา
            total += weight * pricePerKg;
        });

        return total;
    }, [formData, pricing]);
    // -----------------------------------------------------


    // Fetch Suggestions (Logic เดิม)
    const fetchSuggestions = useMemo(
        () => debounce(async (query) => {
            if (query.length < 2) {
                setSuggestions([]);
                return;
            }
            setSearchLoading(true);
            try {
                const res = await api.get(`/admin/addresses/search?search=${query}`);
                setSuggestions(res.data.addresses);
            } catch (err) {
                console.error('Search suggestion error:', err);
                setSuggestions([]);
            } finally {
                setSearchLoading(false);
            }
        }, 300),
        []
    );

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        setFormData((prev) => ({ ...prev, address_id: '' })); 
        setSelectedAddress(null);
        fetchSuggestions(val);
    };

    const handleSelectSuggestion = (address) => {
        // ต้องเพิ่ม address_type เข้าไปใน Address object ที่ Backend ส่งมา (Backend Code ที่ผมให้ไปทำแล้ว)
        setFormData((prev) => ({ ...prev, address_id: address.address_id }));
        setSelectedAddress(address); 
        setSearchQuery(`ID ${address.address_id} - ${address.house_no} (${address.user_name})`);
        setSuggestions([]); 
    };

    const handleClearAddress = () => {
        setFormData(initialWasteState); // Reset ทุกอย่าง
        setSelectedAddress(null);
        setSearchQuery('');
        setSuggestions([]);
        setPricing({});
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        const { address_id, recorded_date, general, hazardous, recyclable, organic } = formData;

        if (!address_id || !recorded_date || !selectedAddress) {
            setError('กรุณาเลือกที่อยู่ให้ถูกต้อง');
            return;
        }

        const weights = {
            general: parseFloat(general) || 0,
            hazardous: parseFloat(hazardous) || 0,
            recyclable: parseFloat(recyclable) || 0,
            organic: parseFloat(organic) || 0,
        };

        const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
        
        // Final confirmation (ใช้ calculatedTotal ที่รวมยอดแล้ว)
        if (!confirm(`ยืนยันการบันทึกขยะ และสร้างบิลรวมยอด ${calculatedTotal.toFixed(2)} บาท?`)) {
            return;
        }
        
        setLoading(true);

        try {
            const res = await api.post('/admin/record-and-bill-manual', {
                address_id: Number(address_id),
                recorded_date: recorded_date,
                weights: weights,
            });

            setMessage(res.data.message || 'บันทึกขยะและสร้างบิลสำเร็จ!');
            // รีเซ็ตฟอร์มหลังจากสำเร็จ
            setFormData(initialWasteState); 
            setSelectedAddress(null);
            setSearchQuery('');
        } catch (err) {
            console.error('Manual Billing Error:', err);
            setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างบิล กรุณาลองใหม่');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition duration-150";

    return (
        <AdminLayout>
            <div className="mx-auto w-full max-w-2xl">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">สร้างบิลด้วยตนเอง (Manual Billing)</h1>
                <p className="text-sm text-gray-600 mb-4 border-l-4 border-emerald-400 pl-3 py-1 bg-emerald-50 rounded-lg">
                    ฟังก์ชันนี้จะทำการ <span className='font-semibold'>บันทึกขยะใหม่</span> แล้ว <span className='font-semibold'>รวมยอดขยะที่ค้างจ่ายทั้งหมด</span> เพื่อออกบิลใหม่ให้ทันที
                </p>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center gap-2 font-medium">
                        <FaExclamationCircle className='text-xl' /> {error}
                    </div>
                )}
                {message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 font-medium">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg">
                    {/* ข้อมูลที่อยู่ */}
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">1. เลือกที่อยู่</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* INPUT SEARCH SUGGESTION FIELD (Col 1) */}
                        <div className="relative col-span-1 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="address_search">
                                ค้นหาที่อยู่ (ID, บ้านเลขที่, ชื่อ)
                            </label>
                            <div className="flex items-center relative">
                                <input
                                    type="text"
                                    id="address_search"
                                    name="address_search"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className={`${inputClass} pl-10 ${selectedAddress ? 'border-emerald-500' : ''}`}
                                    placeholder="พิมพ์ ID ที่อยู่ หรือ ชื่อผู้ใช้"
                                    autoComplete="off"
                                    disabled={selectedAddress !== null} 
                                />
                                <FaSearch className="absolute left-3 text-gray-400" />
                                {searchLoading && <div className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 border-t-2 border-green-500 border-solid rounded-full animate-spin"></div>}
                            </div>
                            
                            {/* รายการแนะนำ */}
                            {suggestions.length > 0 && (
                                <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                                    {suggestions.map((addr) => (
                                        <li
                                            key={addr.address_id}
                                            onClick={() => handleSelectSuggestion(addr)}
                                            className="p-3 hover:bg-gray-100 cursor-pointer text-sm transition"
                                        >
                                            <span className="font-semibold text-emerald-600">ID {addr.address_id}</span>
                                            <span className="text-gray-700"> | บ้านเลขที่ {addr.house_no}, {addr.sub_district} ({addr.user_name})</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                         {/* วันที่บันทึกขยะ (Col 2) */}
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="recorded_date">
                                วันที่บันทึกขยะ (Recorded Date)
                            </label>
                            <input
                                type="date"
                                id="recorded_date"
                                name="recorded_date"
                                value={formData.recorded_date}
                                onChange={handleChange}
                                className={inputClass}
                                required
                            />
                        </div>

                        {/* ✅ SELECTED ADDRESS CARD */}
                        <div className="col-span-full">
                            {selectedAddress ? (
                                <div className="mt-2 bg-emerald-50 border border-emerald-300 p-4 rounded-xl flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                                            <FaCheckCircle /> ที่อยู่ถูกเลือกแล้ว ({selectedAddress.address_type === 'establishment' ? 'สถานประกอบการ' : 'ครัวเรือน'})
                                        </p>
                                        <p className="text-sm mt-1 text-gray-700">
                                            <span className="font-semibold">ID: {selectedAddress.address_id}</span> | 
                                            บ้าน: {selectedAddress.house_no} ม.{selectedAddress.village_no} |
                                            ผู้ใช้: {selectedAddress.user_name}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleClearAddress}
                                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition"
                                        title="เปลี่ยนที่อยู่"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-2 text-sm text-gray-500 p-3 bg-gray-50 border rounded-xl">
                                    💡 กรุณาพิมพ์ ID, บ้านเลขที่, หรือชื่อผู้ใช้ เพื่อค้นหาที่อยู่
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ข้อมูลน้ำหนักขยะ */}
                    <h2 className="text-xl font-semibold mt-8 mb-4 text-gray-700 border-b pb-2">2. น้ำหนักขยะที่เก็บ (กิโลกรัม)</h2>
                    
                    {/* ✅ LOADING PRICING STATE */}
                    {pricingLoading && (
                        <div className='flex items-center text-sm text-gray-500 mb-4'>
                            <FaSpinner className='animate-spin mr-2' /> กำลังโหลดข้อมูลราคา...
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                        {/* ทั่วไป */}
                        <div className='col-span-1'>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="general">🗑️ ทั่วไป <span className='text-xs text-gray-500'>({pricing.general || 0} บ./กก.)</span></label>
                            <input type="text" id="general" name="general" value={formData.general} onChange={handleChange} className={inputClass} placeholder="0.00" inputMode='decimal' />
                        </div>
                        {/* อินทรีย์ */}
                        <div className='col-span-1'>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="organic">🌱 อินทรีย์ <span className='text-xs text-gray-500'>({pricing.organic || 0} บ./กก.)</span></label>
                            <input type="text" id="organic" name="organic" value={formData.organic} onChange={handleChange} className={inputClass} placeholder="0.00" inputMode='decimal' />
                        </div>
                        {/* รีไซเคิล */}
                        <div className='col-span-1'>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="recyclable">♻️ รีไซเคิล <span className='text-xs text-emerald-600'>({pricing.recyclable || 0} บ./กก.)</span></label>
                            <input type="text" id="recyclable" name="recyclable" value={formData.recyclable} onChange={handleChange} className={inputClass} placeholder="0.00" inputMode='decimal' />
                        </div>
                        {/* อันตราย */}
                        <div className='col-span-1'>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="hazardous">🛢️ อันตราย <span className='text-xs text-red-600'>({pricing.hazardous || 0} บ./กก.)</span></label>
                            <input type="text" id="hazardous" name="hazardous" value={formData.hazardous} onChange={handleChange} className={inputClass} placeholder="0.00" inputMode='decimal' />
                        </div>
                    </div>
                    
                    {/* ✅ สรุปยอดรวมชั่วคราว */}
                    <div className="mt-6 p-4 bg-emerald-100/50 border border-emerald-300 rounded-xl flex justify-between items-center">
                        <span className="font-semibold text-gray-700">ยอดรวมขยะใหม่ (คำนวณ)</span>
                        <span className={`text-2xl font-bold ${calculatedTotal >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {calculatedTotal.toFixed(2)} THB
                        </span>
                    </div>


                    <button
                        type="submit"
                        disabled={loading || !formData.address_id || pricingLoading} // ปิดปุ่มถ้ายังไม่เลือก ID หรือกำลังโหลดราคา
                        className="mt-8 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'กำลังบันทึกและสร้างบิล...' : 'บันทึกขยะ & สร้างบิลทันที'}
                    </button>
                </form>
            </div>
        </AdminLayout>
    );
};

export default AdminManulBill;