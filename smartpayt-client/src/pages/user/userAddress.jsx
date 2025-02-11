import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function UserAddress() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetch("http://localhost:3000/api/userAddress", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          localStorage.removeItem("token");
          navigate("/login");
          return Promise.reject("Unauthorized");
        }
        return res.json();
      })
      .then((data) => setUsers(data))
      .catch((err) => console.error("Error fetching UserAddress:", err));
  }, [navigate]);

  return (
    <div>
      <h1>User Address</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <strong>ID:</strong> {user.id}, <strong>Phone No:</strong> {user.Phone_No}, <strong>Address:</strong> {user.Address}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UserAddress;
