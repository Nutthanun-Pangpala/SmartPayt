import React from 'react';
import logo from '../assets/img/2-removebg-preview-2.png'; // Corrected import
import RegisterUserForm from '../formUsers/RegisterUserForm';
import "../index.css";

const   RegisterAccount = () => {
 

  return (
    <div className="container mx-auto my-10 flex flex-col items-center">
      <img className="w-auto h-60 mb-4" src={logo} alt="Logo" />
      <h2 className="text-2xl font-bold text-center mb-6">ลงทะเบียน</h2>
      <RegisterUserForm />
    </div>
  );
};

export default RegisterAccount;
