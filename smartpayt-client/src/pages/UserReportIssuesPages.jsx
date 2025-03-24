import React from 'react';
import logo from '../assets/img/2-removebg-preview-2.png'; // Corrected import
import ReportIssuesForm from '../form/ReportIssuesForm';
import "../index.css";

const Issues = () => {
 

  return (
    <div className="container mx-auto my-10 flex flex-col items-center">
      <img className="w-auto h-60 mb-4" src={logo} alt="Logo" />
      <h2 className="text-2xl font-bold text-center mb-6">รายงานปัญหา</h2>
      <ReportIssuesForm/>
    </div>
  );
};

export default Issues;
