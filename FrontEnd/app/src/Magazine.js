import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const Magazine = () => {
  // State for input fields
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedBoard, setSelectedBoard] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const [excelData, setExcelData] = useState(null);
  const [error, setError] = useState('');
  const [excelCreationStatus, setExcelCreationStatus] = useState('');

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

    try {
      // Loop over each student in the selected sheet and create the magazine
      for (const student of jsonData) {
        const response = await axios.post('http://localhost:5000/create-magazine', {
          // name: student.Name,
          board: selectedBoard,
          className: selectedClass,
          section: selectedSection,
          // individualPhotoId: student['Individual Photo ID'],
          //groupPhotoId: student['Group Photo ID']
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
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 md:p-8 lg:p-12 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Create Magazine Of Individual Students</h2>

      {error && <p className="text-red-500">{error}</p>}

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

      {/* Class Input */}
      <div>
        <label className="block mb-2">Enter Class:</label>
        <input
          id="class-input"
          type="text"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
