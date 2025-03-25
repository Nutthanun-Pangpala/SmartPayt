import React from 'react';
import UserAddressesCard from '../assets/component/user/UserDashboard/userAddressCard';
import UserDatacard from '../assets/component/user/UserDashboard/userDataCard';
import NavbarComponent from '../assets/component/user/userNavbar';

const UserDashboard = () => {

  return (
      <div className=' bg-gray-200 min-h-screen'>
      <NavbarComponent/>
      <UserDatacard/>
      <UserAddressesCard/>
      </div>
  );
};

export default UserDashboard;
