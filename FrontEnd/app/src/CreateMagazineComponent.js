import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const CreateMagazineComponent = () => {
  const [excelData, setExcelData] = useState([]);
  const [boardOptions, setBoardOptions] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [groupCameraId, setGroupCameraId] = useState('');
  const [groupPhotoId, setGroupPhotoId] = useState('');

  const [individualPhotoId, setIndividualPhotoId] = useState('');
  const [message, setMessage] = useState('');

  // Handle Excel file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      console.log('File loaded:', event.target.result);
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      console.log('Sheet Name:', sheetName);
      const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      console.log('Sheet Data:', sheet);

      setExcelData(sheet);
      populateDropdowns(sheet);
    };

    reader.readAsArrayBuffer(file);
    console.log('File upload triggered');
  };

  // Populate dropdown values dynamically from Excel data
  const populateDropdowns = (data) => {
    const boards = [...new Set(data.map((item) => item.Board))];
    const classes = [...new Set(data.map((item) => item.Class))];
    const sections = [...new Set(data.map((item) => item.Section))];

    console.log('Boards:', boards);
    console.log('Classes:', classes);
    console.log('Sections:', sections);

    setBoardOptions(boards);
    setClassOptions(classes);
    setSectionOptions(sections);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submission triggered');
    console.log('Selected Board:', selectedBoard);
    console.log('Selected Class:', selectedClass);
    console.log('Selected Section:', selectedSection);
    console.log('Group Camera ID:', groupCameraId);
    console.log('Individual Photo ID:', individualPhotoId);

    try {
      const response = await fetch('http://localhost:3001/api/generate-magazine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          board: selectedBoard,
          class: selectedClass,
          section: selectedSection,
          groupCameraId,
          individualPhotoId,
          groupPhotoId,
        }),
      });

      const result = await response.json();
      console.log('API Response:', result);
      setMessage(result.message || 'Magazine generated and saved successfully.');
    } catch (error) {
      console.error('Error creating magazine:', error);
      setMessage('Error creating magazine. Please try again.');
    }
  };


  const handleStudentSelection = () => {
    const selectedStudent = excelData.find((item) =>
      item.Board === selectedBoard &&
      item.Class === selectedClass &&
      item.Section === selectedSection
    );
    
    if (selectedStudent) {
      setGroupPhotoId(selectedStudent['Group Photo ID'] || '');
    }
  };
  
  // Call this function whenever selections change
  React.useEffect(() => {
    handleStudentSelection();
  }, [selectedBoard, selectedClass, selectedSection]);
  

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-md">
      <h1 className="text-3xl font-bold mb-6 text-center">Magazine Generator</h1>
      
      {/* Excel File Upload */}
      <div className="mb-6">
        <label className="block text-lg font-semibold mb-2">Upload Excel Sheet</label>
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer focus:outline-none focus:ring focus:border-blue-300"
        />
      </div>

      {/* Form for user inputs */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Board Dropdown */}
        <div>
          <label className="block text-lg font-semibold mb-2">Board</label>
          <select
            value={selectedBoard}
            onChange={(e) => setSelectedBoard(e.target.value)}
            className="block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-200"
          >
            <option value="">Select Board</option>
            {boardOptions.map((board, index) => (
              <option key={index} value={board}>{board}</option>
            ))}
          </select>
        </div>

        {/* Class Dropdown */}
        <div>
          <label className="block text-lg font-semibold mb-2">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-200"
          >
            <option value="">Select Class</option>
            {classOptions.map((classItem, index) => (
              <option key={index} value={classItem}>{classItem}</option>
            ))}
          </select>
        </div>

        {/* Section Dropdown */}
        <div>
          <label className="block text-lg font-semibold mb-2">Section</label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-200"
          >
            <option value="">Select Section</option>
            {sectionOptions.map((section, index) => (
              <option key={index} value={section}>{section}</option>
            ))}
          </select>
        </div>

        {/* Group Camera ID */}
        <div>
          <label className="block text-lg font-semibold mb-2">Group Camera ID</label>
          <input
            type="text"
            value={groupCameraId}
            onChange={(e) => setGroupCameraId(e.target.value)}
            className="block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-200"
            placeholder="Enter Group Camera ID"
          />
        </div>

        {/* Individual Photo ID */}
        <div>
          <label className="block text-lg font-semibold mb-2">Individual Photo ID</label>
          <input
            type="text"
            value={individualPhotoId}
            onChange={(e) => setIndividualPhotoId(e.target.value)}
            className="block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-200"
            placeholder="Enter Individual Photo ID"
          />
        </div>

        {/* Group Photo ID */}
<div>
  <label className="block text-lg font-semibold mb-2">Group Photo ID</label>
  <input
    type="text"
    value={groupPhotoId}
    readOnly
    className="block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-200"
    placeholder="Group Photo ID"
  />
</div>


        {/* Submit Button */}
        <button
          type="submit"
          className="w-full px-4 py-2 text-white bg-blue-600 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300"
        >
          Generate Magazine
        </button>
      </form>

      {/* Status Message */}
      {message && (
        <p className="mt-6 text-center text-lg font-medium text-green-600">{message}</p>
      )}
    </div>
  );
};

export default CreateMagazineComponent;
