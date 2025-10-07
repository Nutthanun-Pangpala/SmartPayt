import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import ToastNotification from '../assets/component/user/ToastNotification';

// แก้ marker icon (Leaflet)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  const customIcon = new L.Icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [28, 44],
    iconAnchor: [14, 44],
    popupAnchor: [1, -40],
    shadowSize: [44, 44],
  });

  return position ? <Marker position={position} icon={customIcon} /> : null;
};

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export default function RegisterAddressForm() {
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const [formData, setFormData] = useState({
    lineUserId: localStorage.getItem('lineUserId') || '',
    address_type: 'household',     // ✅ ค่าเริ่มต้น
    house_no: '',
    village_no: '',
    alley: '',
    province: 'เชียงราย',
    district: 'อำเภอเมือง',
    sub_district: '',
    postal_code: '57100',
    lat: null,
    lng: null,
  });

  const [searchAddress, setSearchAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [markerPosition, setMarkerPosition] = useState(null);

  const [showMap, setShowMap] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ตรวจสอบผู้ใช้
  useEffect(() => {
    const checkUserId = async () => {
      const lineUserId = localStorage.getItem('lineUserId');
      if (!lineUserId) return navigate('/userLogin');
      setFormData((prev) => ({ ...prev, lineUserId }));
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/checkUser/${lineUserId}`);
        if (res.data.exists) navigate('/'); // มีผู้ใช้อยู่แล้ว
      } catch (err) {
        console.error('Error checking user:', err);
      }
    };
    checkUserId();
  }, [navigate]);

  // class อินพุตให้หน้าตาสวยสม่ำเสมอ
  const inputClass =
    'w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';

  const handleChange = (e) => {
    const { name, value } = e.target;
    // number-only สำหรับ postal_code (5 หลัก)
    if (name === 'postal_code') {
      const v = value.replace(/\D/g, '').slice(0, 5);
      setFormData((prev) => ({ ...prev, [name]: v }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchAddressFromCoords = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { 'User-Agent': 'SmartPaytApp/1.0' } }
      );
      const data = await res.json();
      return data.address;
    } catch (err) {
      console.error('Error fetching address:', err);
      return {};
    }
  };

  const confirmPosition = async () => {
    if (!markerPosition) return alert('กรุณาคลิกเลือกจุดบนแผนที่');
    const { lat, lng } = markerPosition;
    const address = await fetchAddressFromCoords(lat, lng);

    setFormData((prev) => ({
      ...prev,
      // ใช้ข้อมูลที่หาได้ + ค่า default
      province: prev.province || 'เชียงราย',
      district: address?.county || address?.state_district || prev.district || '',
      sub_district: address?.suburb || address?.village || address?.hamlet || prev.sub_district || '',
      postal_code: address?.postcode || prev.postal_code || '',
      lat,
      lng,
    }));
    setShowMap(false);
    setSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    // ตรวจฟิลด์จำเป็น
    const requiredFields = [
      'address_type',
      'house_no',
      'village_no',
      'province',
      'district',
      'sub_district',
      'postal_code',
    ];
    const errs = [];
    for (const f of requiredFields) {
      if (!formData[f]) errs.push(`กรุณากรอก ${f}`);
    }
    if (!/^[\wก-ฮะ-์\s\/-]+$/.test(formData.house_no)) errs.push('บ้านเลขที่ต้องเป็นตัวเลข/ตัวอักษรได้');
    if (!/^\d{5}$/.test(formData.postal_code)) errs.push('รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก');

    if (errs.length) {
      setError(errs.join('\n'));
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/registerAddress`, formData);
      setMessage(res.data.message || 'ลงทะเบียนสำเร็จ!');
      setTimeout(() => navigate('/UserDashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  // ค้นหาแนะนำ (debounce)
  const fetchSuggestions = useMemo(
    () =>
      debounce(async (query) => {
        if (!query) {
          setSuggestions([]);
          return;
        }
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              query
            )}&addressdetails=1&limit=8`,
            { headers: { 'User-Agent': 'SmartPaytApp/1.0' } }
          );
          const data = await res.json();
          setSuggestions(data);
        } catch (err) {
          console.error('Error fetching suggestions:', err);
        }
      }, 300),
    []
  );

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchAddress(val);
    fetchSuggestions(val);
  };

  const handleSelectSuggestion = (place) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    setMarkerPosition({ lat, lng: lon });
    setSearchAddress(place.display_name);
    setSuggestions([]);
    if (mapRef.current) {
      mapRef.current.setView([lat, lon], 16);
    }
  };

  const centerTH = [19.9, 99.8]; // Chiang Rai
  const canUseGeo = typeof navigator !== 'undefined' && !!navigator.geolocation;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-6 px-4">
      <ToastNotification message={message} error={error} />

      <div className="mx-auto w-full max-w-xl">
        {/* หัวเรื่อง */}
        <div className="mb-5">
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-700">ลงทะเบียนที่อยู่</h1>
          <p className="text-sm text-gray-600 mt-1">
            กรอกข้อมูลที่อยู่ให้ครบถ้วน และปักหมุดตำแหน่งเพื่อความแม่นยำในการให้บริการ
          </p>
        </div>

        {/* การ์ดฟอร์ม */}
        <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-5 md:p-6 shadow-sm">
          {/* ประเภทที่อยู่ */}
          <div className="mb-4">
            <label htmlFor="address_type" className="block mb-1 font-medium">
              ประเภทที่อยู่
            </label>
            <select
              id="address_type"
              name="address_type"
              value={formData.address_type}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="household">ครัวเรือน</option>
              <option value="establishment">สถานประกอบการ</option>
            </select>
          </div>

          {/* บ้านเลขที่ / หมู่ / ถนนซอย */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="house_no" className="block mb-1 font-medium">
                บ้านเลขที่
              </label>
              <input
                id="house_no"
                name="house_no"
                type="text"
                value={formData.house_no}
                onChange={handleChange}
                className={inputClass}
                placeholder="เช่น 123/4"
                required
              />
            </div>
            <div>
              <label htmlFor="village_no" className="block mb-1 font-medium">
                หมู่ที่
              </label>
              <input
                id="village_no"
                name="village_no"
                type="text"
                value={formData.village_no}
                onChange={handleChange}
                className={inputClass}
                placeholder="เช่น 5"
                required
              />
            </div>
            <div>
              <label htmlFor="alley" className="block mb-1 font-medium">
                ถนน / ซอย
              </label>
              <input
                id="alley"
                name="alley"
                type="text"
                value={formData.alley}
                onChange={handleChange}
                className={inputClass}
                placeholder="ถ้ามี"
              />
            </div>
          </div>

          {/* จังหวัด / อำเภอ / ตำบล / รหัสไปรษณีย์ */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="md:col-span-2">
              <label htmlFor="province" className="block mb-1 font-medium">
                จังหวัด
              </label>
              <input
                id="province"
                name="province"
                type="text"     // ✅ แก้บั๊กจาก type="เชียงราย"
                value={formData.province}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="district" className="block mb-1 font-medium">
                อำเภอ / เขต
              </label>
              <input
                id="district"
                name="district"
                type="text"
                value={formData.district}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="sub_district" className="block mb-1 font-medium">
                ตำบล
              </label>
              <input
                id="sub_district"
                name="sub_district"
                type="text"
                value={formData.sub_district}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
            <div className="md:col-span-1">
              <label htmlFor="postal_code" className="block mb-1 font-medium">
                รหัสไปรษณีย์
              </label>
              <input
                id="postal_code"
                name="postal_code"
                type="text"
                value={formData.postal_code}
                onChange={handleChange}
                className={inputClass}
                required
                inputMode="numeric"
                maxLength={5}
                placeholder="57100"
              />
            </div>
          </div>

          {/* ปุ่มแผนที่ */}
          <div className="mt-5 flex flex-col md:flex-row gap-3">
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-semibold transition"
            >
              🗺️ เลือกตำแหน่งจากแผนที่
            </button>

            {formData.lat && formData.lng ? (
              <div className="text-sm text-gray-500 bg-gray-50 border rounded-xl px-3 py-2">
                📍 lat: {formData.lat.toFixed(6)} , lng: {formData.lng.toFixed(6)}
              </div>
            ) : (
              <div className="text-sm text-gray-500 bg-gray-50 border rounded-xl px-3 py-2">
                📍 ยังไม่ได้ปักหมุดตำแหน่ง
              </div>
            )}
          </div>

          {/* ปุ่ม submit */}
          <button
            type="submit"
            className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'กำลังลงทะเบียน…' : 'ลงทะเบียนที่อยู่'}
          </button>
        </form>
      </div>

      {/* โมดัลแผนที่ */}
      {showMap && (
        <div className="fixed inset-0 z-[60]">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMap(false)}
          />
          {/* panel */}
          <div className="absolute inset-x-0 bottom-0 md:inset-8 md:rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
            {/* header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold">เลือกตำแหน่งบนแผนที่</div>
              <button
                type="button"
                onClick={() => setShowMap(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✖
              </button>
            </div>

            {/* ช่องค้นหา */}
            <div className="p-4 relative">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchAddress}
                  onChange={handleSearchChange}
                  placeholder="ค้นหาที่อยู่หรือสถานที่"
                  className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!searchAddress) return alert('กรุณากรอกที่อยู่ก่อน');
                    try {
                      const res = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                          searchAddress
                        )}&addressdetails=1&limit=1`,
                        { headers: { 'User-Agent': 'SmartPaytApp/1.0' } }
                      );
                      const data = await res.json();
                      if (!data.length) return alert('ไม่พบที่อยู่นี้');
                      const place = data[0];
                      const lat = parseFloat(place.lat);
                      const lon = parseFloat(place.lon);
                      setMarkerPosition({ lat, lng: lon });
                      if (mapRef.current) mapRef.current.setView([lat, lon], 16);
                    } catch (err) {
                      console.error(err);
                      alert('เกิดข้อผิดพลาดในการค้นหา');
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                >
                  🔍 ค้นหา
                </button>
                {canUseGeo && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          const { latitude, longitude } = pos.coords;
                          setMarkerPosition({ lat: latitude, lng: longitude });
                          if (mapRef.current)
                            mapRef.current.setView([latitude, longitude], 16);
                        },
                        () => alert('ไม่สามารถอ่านตำแหน่งปัจจุบันได้')
                      );
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                  >
                    📡 ตำแหน่งปัจจุบัน
                  </button>
                )}
              </div>

              {/* รายการแนะนำ */}
              {suggestions.length > 0 && (
                <ul className="absolute z-50 mt-2 w-full max-h-52 overflow-auto bg-white border rounded-lg shadow-xl">
                  {suggestions.map((place) => (
                    <li
                      key={place.place_id}
                      onClick={() => handleSelectSuggestion(place)}
                      className="p-2 cursor-pointer hover:bg-gray-100 text-sm"
                    >
                      {place.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* แผนที่ */}
            <div className="px-4 pb-4">
              <div className="rounded-xl overflow-hidden border">
                <MapContainer
                  center={centerTH}
                  zoom={10}
                  style={{ height: '55vh', width: '100%' }}
                  whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationMarker
                    position={markerPosition}
                    setPosition={setMarkerPosition}
                  />
                </MapContainer>
              </div>

              <div className="flex flex-col md:flex-row gap-3 mt-4">
                <button
                  type="button"
                  onClick={confirmPosition}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold"
                >
                  ✅ ยืนยันตำแหน่งนี้
                </button>
                <button
                  type="button"
                  onClick={() => setShowMap(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold"
                >
                  ❌ ปิดแผนที่
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
