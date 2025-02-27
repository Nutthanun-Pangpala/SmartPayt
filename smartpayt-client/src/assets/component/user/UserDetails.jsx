import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const UserDetails = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();

  const code = searchParams.get("code");
  useEffect(() =>{
    setLoading
    if (code) {
      // ส่ง code ไปที่ backend เพื่อดึงข้อมูลผู้ใช้
      axios.post("http://localhost:5000/api/auth/line", { code })
          .then(response => {
              setUser(response.data);
          })
          .catch(error => console.error("Error fetching data:", error));
  }
},[code]);

  return (
    <div className="container p-4">
      <h1 className="text-2xl font-semibold mb-4">User Details</h1>

      {loading && <p>Loading...</p>}


      {user && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold">User Information</h2>
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Line User ID:</strong> {user.lineUserId}</p>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
      )}
    </div>
  );
};

export default UserDetails;
