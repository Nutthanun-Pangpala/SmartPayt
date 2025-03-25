import React from 'react';
import AdminNavbar from '../../assets/component/admin/AdminNavbar';
import AdminUserAddresses from '../../form/AdminUserAddresses';


const AdminDashboard = () => { 
  return (
    <>
      <AdminNavbar />
      <div>
        <h1>Admin User Addresses</h1>
        <AdminUserAddresses />
      </div>
    </>
  );
};

export default AdminDashboard; 
