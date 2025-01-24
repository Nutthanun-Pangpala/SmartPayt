import liff from '@line/liff';
import React, { useEffect } from 'react';
import logo from '../assets/img/2-removebg-preview-2.png'; // Corrected import
import RegisterForm from '../from/RegisterFrom'; // Correct the path if necessary
import "../index.css";

const Register = () => {
  useEffect(() => {
    const initializeLiff = async () => {
        try {
            console.log('Initializing LIFF...');
            await liff.init({ liffId: '2006592847-7XwNn0YG' });

            if (liff.isLoggedIn()) {
                console.log('User is logged in.');
                await handleLogin();
            } 
                else {
                    const profile = await liff.getProfile();
                    console.log("User Profile:", profile);
                  }
            
        } catch (err) {
            console.error('LIFF Initialization Error:', err);
        }
    };
    

    const handleLogin = async () => {
        try {
            const profile = await liff.getProfile();
            console.log('User Profile:', profile);
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    initializeLiff();
}, []);
  return (
    <div className="container mx-auto my-10 flex flex-col items-center">
      <img className="w-auto h-60 mb-4" src={logo} alt="Logo" />
      <h2 className="text-2xl font-bold text-center mb-6">ลงทะเบียน</h2>
      <RegisterForm />
    </div>
  );
};

export default Register;
