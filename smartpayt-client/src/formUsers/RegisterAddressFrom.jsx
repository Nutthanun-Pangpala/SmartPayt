import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import ToastNotification from '../assets/component/user/ToastNotification';

// แก้ marker icon
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const LocationMarker = ({ position, setPosition }) => {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  const customIcon = new L.Icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
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

const RegisterAddressForm = () => {
  const [formData, setFormData] = useState({
    lineUserId: localStorage.getItem("lineUserId") || "",
    house_no: "",
    village_no:"",
    alley: "",
    province: "เชียงราย",
    district: "อำเภอเมือง",
    sub_district: "",
    postal_code: "57100",
    lat: null,
    lng: null,
    
  });
  const [searchAddress, setSearchAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const mapRef = useRef(null);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserId = async () => {
      const lineUserId = localStorage.getItem("lineUserId");
      if (!lineUserId) return navigate("/userLogin");

      setFormData((prev) => ({ ...prev, lineUserId }));

      try {
        const res = await axios.get(`http://localhost:3000/api/checkUser/${lineUserId}`);
        if (res.data.exists) navigate("/");
      } catch (err) {
        console.error("Error checking user:", err);
      }
    };
    checkUserId();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchAddressFromCoords = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`, {
        headers: { 'User-Agent': 'SmartPaytApp/1.0' }
      });
      const data = await res.json();
      return data.address;
    } catch (err) {
      console.error("Error fetching address:", err);
      return {};
    }
  };

  const confirmPosition = async () => {
    if (!markerPosition) return alert("กรุณาคลิกเลือกจุดบนแผนที่");

    const { lat, lng } = markerPosition;
    const address = await fetchAddressFromCoords(lat, lng);

    setFormData((prev) => ({
      ...prev,
      province: 'เชียงราย',
      district: address?.county || '',
      sub_district: address?.suburb || address?.village || '',
      postal_code: address?.postcode || '',
      lat,
      lng
    }));
    setShowMap(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    
    const requiredFields = ["house_no", "village_no", "province", "district", "sub_district", "postal_code"];
    const errors = requiredFields.filter(f => !formData[f]).map(f => `กรุณากรอก ${f}`);
    
    if (!/^[\w\s\/-]+$/.test(formData.house_no)) errors.push("บ้านเลขที่ต้องเป็นตัวเลขหรือตัวอักษรเท่านั้น");
    if (!/^\d{5}$/.test(formData.postal_code)) errors.push("รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก");
    
    if (errors.length) {
      setError(errors.join("\n"));
      setLoading(false);
      return;
    }
    
    try {
      const res = await axios.post('http://localhost:3000/api/registerAddress', formData);
      setMessage(res.data.message || 'ลงทะเบียนสำเร็จ!');
      setTimeout(() => navigate('/UserDashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };


  const fetchSuggestions = debounce(async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`, {
        headers: { 'User-Agent': 'SmartPaytApp/1.0' }
      });
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  }, 300);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchAddress(val);
    fetchSuggestions(val);
  };

  const handleSelectSuggestion = (place) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    setMarkerPosition({ lat, lng: lon });
    if (mapRef.current) {
      mapRef.current.setView([lat, lon], 16);
    }
    setSearchAddress(place.display_name);
    setSuggestions([]);
  };
  

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <ToastNotification message={message} error={error} />
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl bg-white p-6 rounded-lg shadow-md"
      >
       <div className="mb-4">
  <label className="block mb-1 font-medium" htmlFor="address_type">ประเภทที่อยู่</label>
  <select
    id="address_type"
    name="address_type"
    value={formData.address_type}
    onChange={handleChange}
    className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="household">ครัวเรือน</option>
    <option value="establishment">สถานประกอบการ</option>
  </select>
</div>



        <div className="mb-4">
          <label className="block mb-1 font-medium" htmlFor="house_no">บ้านเลขที่</label>
          <input
            id="house_no"
            name="house_no"
            type="text"
            value={formData.house_no}
            onChange={handleChange}
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium" htmlFor="house_no">หมู่ที่</label>
          <input
            id="village_no"
            name="village_no"
            type="text"
            value={formData.village_no}
            onChange={handleChange}
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium" htmlFor="alley">ถนน / ซอย</label>
          <input
            id="alley"
            name="alley"
            type="text"
            value={formData.alley}
            onChange={handleChange}
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ถ้ามี"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 font-medium" htmlFor="province">จังหวัด</label>
            <input
              id="province"
              name="province"
              type="เชียงราย"
              value={formData.province}
              onChange={handleChange}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium" htmlFor="district">อำเภอ / เขต</label>
            <input
              id="district"
              name="district"
              type="text"
              value={formData.district}
              onChange={handleChange}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium" htmlFor="sub_district">ตำบล </label>
            <input
              id="sub_district"
              name="sub_district"
              type="text"
              value={formData.sub_district}
              onChange={handleChange}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium" htmlFor="postal_code">รหัสไปรษณีย์</label>
            <input
              id="postal_code"
              name="postal_code"
              type="text"
              value={formData.postal_code}
              onChange={handleChange}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              maxLength={5}
              inputMode="numeric"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowMap(true)}
          className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md transition-colors"
        >
          เลือกตำแหน่งจากแผนที่
        </button>

        {showMap && (
          <div className="mb-6">
            <div
  className="relative mb-3"
  style={{ zIndex: 9999 }} // เพิ่มเผื่อโดนซ้อน
>
<div className="relative mb-3" style={{ zIndex: 9999 }}>
  <input
    type="text"
    value={searchAddress}
    onChange={handleSearchChange}
    placeholder="ค้นหาที่อยู่หรือสถานที่"
    className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    autoComplete="off"
    onFocus={() => setSuggestions([])}
  />
  <button
    type="button"
    onClick={async () => {
      if (!searchAddress) return alert("กรุณากรอกที่อยู่ก่อน");

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&addressdetails=1&limit=1`, {
          headers: { 'User-Agent': 'SmartPaytApp/1.0' }
        });
        const data = await res.json();
        if (data.length === 0) {
          alert("ไม่พบที่อยู่นี้");
          return;
        }

        const place = data[0];
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);
        setMarkerPosition({ lat, lng: lon });
        if (mapRef.current) {
          mapRef.current.setView([lat, lon], 16);
        }
      } catch (err) {
        alert("เกิดข้อผิดพลาดในการค้นหา");
        console.error(err);
      }
    }}
    className="mt-2 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
  >
    🔍 ค้นหาที่อยู่นี้และปักหมุด
  </button>

  {suggestions.length > 0 && (
    <ul className="absolute z-50 w-full max-h-48 overflow-auto bg-white border rounded-md shadow-lg">
      {suggestions.map((place) => (
        <li
          key={place.place_id}
          onClick={() => handleSelectSuggestion(place)}
          className="p-2 cursor-pointer hover:bg-gray-200"
        >
          {place.display_name}
        </li>
      ))}
    </ul>
  )}
</div>

  {suggestions.length > 0 && (
    <ul className="absolute z-50 w-full max-h-48 overflow-auto bg-white border rounded-md shadow-lg">
      {suggestions.map((place) => (
        <li
          key={place.place_id}
          onClick={() => handleSelectSuggestion(place)}
          className="p-2 cursor-pointer hover:bg-gray-200"
        >
          {place.display_name}
        </li>
      ))}
    </ul>
  )}
</div>
            <MapContainer
              center={[19.9, 99.8]}
              zoom={10}
              style={{ height: '300px', width: '100%' }}
              whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationMarker position={markerPosition} setPosition={setMarkerPosition} />
            </MapContainer>

            <div className="flex gap-4 mt-3">
              <button
                type="button"
                onClick={confirmPosition}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-md transition-colors"
              >
                ✅ ยืนยันตำแหน่งนี้
              </button>
              <button
                type="button"
                onClick={() => setShowMap(false)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-md transition-colors"
              >
                ❌ ปิดแผนที่
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "กำลังลงทะเบียน..." : "ลงทะเบียนที่อยู่"}
        </button>
      </form>
    </div>
  );
};

export default RegisterAddressForm;
