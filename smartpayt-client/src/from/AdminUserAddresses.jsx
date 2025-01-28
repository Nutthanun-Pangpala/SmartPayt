import axios from 'axios';
import React, { useEffect, useState } from 'react';
import '../index.css';

const AdminUserAddresses = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/');
        setUsers(response.data.data); // assuming response is in data.data format
      } catch (err) {
        setError('Error loading user data');
        console.error(err);
      }
    };

    fetchUsers();
  }, []);

  const handleEdit = (userId) => {
    // Logic to handle editing a user
    alert(`Edit user with ID: ${userId}`);
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/${id}`, {
        method: 'DELETE',
      });
  
      if (response.ok) {
        // Remove the deleted user from the state directly
        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
        alert('ลบข้อมูลสำเร็จ!');
      } else {
        const data = await response.json();
        alert(data.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
      }
    } catch (error) {
      console.error('Error deleting user address:', error);
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };
  

  return (
    <div className="container mx-auto p-5">
      {error && <p className="text-red-500">{error}</p>}
      <table className="min-w-full border-collapse">
        <thead>
          <tr className='bg-green-400'>
            <th className="border p-2 border-black">ID </th>
            <th className="border p-2 border-black">ID Card No</th>
            <th className="border p-2 border-black">Phone No</th>
            <th className="border p-2 border-black">Email</th>
            <th className="border p-2 border-black">Home ID</th>
            <th className="border p-2 border-black">Address</th>
            <th className="border p-2 border-black">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="border p-2">{user.id || 'N/A'}</td>
              <td className="border p-2">{user.ID_card_No || 'N/A'}</td>
              <td className="border p-2">{user.Phone_No || 'N/A'}</td>
              <td className="border p-2">{user.Email || 'N/A'}</td>
              <td className="border p-2">{user.Home_ID || 'N/A'}</td>
              <td className="border p-2">{user.Address || 'N/A'}</td>
              <td className="border p-2">
                <button
                  onClick={() => handleEdit(user.id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                >
                  Edit
                </button>
                <button
  onClick={() => handleDelete(user.id)}
  className="bg-red-500 text-white px-4 py-2 rounded"
>
  Delete
</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUserAddresses;