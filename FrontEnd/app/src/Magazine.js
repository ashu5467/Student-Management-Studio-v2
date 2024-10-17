import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useEffect } from 'react';


const Magazine = () => {
  // State for input fields
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedBoard, setSelectedBoard] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');

  const [excelData, setExcelData] = useState(null);
  const [error, setError] = useState('');
  const [excelCreationStatus, setExcelCreationStatus] = useState('');
  const [ipAddress, setIpAddress] = useState('localhost');
  const [loading, setLoading] = useState(false);


  const fetchIpAddress = async () => {
    try {
      const response = await fetch('http://localhost:3001/get-ip');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.ip !== ipAddress) {
        console.log('Fetched IP address:', data.ip); // Debugging line
        setIpAddress(data.ip);
      }
    } catch (error) {
      console.error('Error fetching IP address:', error);
    }
  };

  useEffect(() => {
    fetchIpAddress(); // Run once on component mount
    const intervalId = setInterval(fetchIpAddress, 1000); // Check for changes every second

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, []); // Empty dependency array ensures this runs only once on mount





  // File upload handler
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      setExcelData(workbook); // Store workbook for later use
    };
    reader.readAsBinaryString(file);
  };

  // Create magazine logic
  const handleCreateMagazine = async () => {
    if (!selectedClass || !selectedBoard || !selectedSection) {
      setError("Please fill in all fields: class, board, and section.");
      return;
    }

    const sheetName = `1_${selectedBoard}_${selectedClass}_${selectedSection}`;
    const sheet = excelData?.Sheets[sheetName];

    if (!sheet) {
      setError(`Sheet ${sheetName} not found in the uploaded Excel file.`);
      return;
    }

    const jsonData = XLSX.utils.sheet_to_json(sheet);
    if (jsonData.length === 0) {
      setError("No data found in the selected sheet.");
      return;
    }


    setLoading(true);

    try {
      // Loop over each student in the selected sheet and create the magazine
      for (const student of jsonData) {
        const response = await axios.post(`http://${ipAddress}:5000/create-magazine`, {
          // name: student.Name,
          board: selectedBoard,
          className: selectedClass,
          section: selectedSection,
          SchoolNumber:selectedSchool,
          groupPhotoId: "Picture 1",
        });

        if (!response.data.success) {
          setError(`Failed to create magazine for student ${student.Name}.`);
          return;
        }
      }

      setExcelCreationStatus("Magazine PDF created successfully for all students!");
    } catch (err) {
      setError("Error creating magazine: " + err.message);
    }finally {
      setLoading(false); // Stop loading when done
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 md:p-8 lg:p-12 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Create Magazine Of Individual Students</h2>

      {error && <p className="text-red-500">{error}</p>}

      {loading && <p className="text-yellow-600">Please wait, magazines are being created...</p>}

      {excelCreationStatus && (
        <p className="text-blue-600" dangerouslySetInnerHTML={{ __html: excelCreationStatus }}></p>
      )}

      <h3 className="text-xl font-semibold">Upload Group Photo Excel and Enter Details</h3>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="block w-full text-sm text-gray-500 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 mb-4 p-2"
      />



      {/* School Number Input */}
      <div>
        <label className="block mb-2">Enter School Number:</label>
        <input
          id="school-input"
          type="text"
          value={selectedSchool}
          onChange={(e) => setSelectedSchool(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 text-base md:text-lg lg:text-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      

      {/* Board Input */}
      <div>
        <label className="block mb-2">Enter Board:</label>
        <input
          id="board-input"
          type="text"
          value={selectedBoard}
          onChange={(e) => setSelectedBoard(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 text-base md:text-lg lg:text-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Class Input */}
      <div>
        <label className="block mb-2">Enter Class:</label>
        <input
          id="class-input"
          type="text"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 text-base md:text-lg lg:text-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      


      {/* Section Input */}
      <div>
        <label className="block mb-2">Enter Section:</label>
        <input
          id="section-input"
          type="text"
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 text-base md:text-lg lg:text-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <button
        onClick={handleCreateMagazine}
        className="mt-4 w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Create Magazine
      </button>
    </div>
  );
};

export default Magazine;
