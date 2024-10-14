import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';

function TeacherDataComponent() {
  const [formData, setFormData] = useState({
    nameDropdown: '',
    teacherIdInput: '',
    cameraIdInput: '',
  });
  const [teacherData, setTeacherData] = useState(null);
  const [allTeachers, setAllTeachers] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [photoId, setPhotoId] = useState('');
  const [workbook, setWorkbook] = useState(null);
  const [fileName, setFileName] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      setWorkbook(workbook);

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const teacherData = jsonData.slice(1).map((row) => ({
        teacherId: row[0],
        teacherName: row[1],
        cameraId: row[2],
        photoId: row[3] || '', // Ensure photoId is handled properly
      }));

      setAllTeachers(teacherData);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  
    // Ensure the user selects a teacher name
    if (!formData.nameDropdown) {
      alert('Please select a Teacher Name.');
      return;
    }
  
    // Ensure the user enters at least one input
    if (!formData.teacherIdInput && !formData.cameraIdInput) {
      alert('Please enter either Teacher ID or Camera ID.');
      return;
    }
  
    // Find the teacher using the selected name and any provided input
    const foundTeacher = allTeachers.find((teacher) => {
      // Check if the name matches
      const nameMatch = teacher.teacherName === formData.nameDropdown;
      
      // Check if the teacherId matches if provided
      const idMatch = formData.teacherIdInput ? teacher.teacherId === formData.teacherIdInput : true;
      
      // Check if the cameraId matches if provided
      const cameraMatch = formData.cameraIdInput ? teacher.cameraId === formData.cameraIdInput : true;
  
      // Return true if both name matches and either ID or Camera match
      return nameMatch && idMatch && cameraMatch;
    });
  
    if (foundTeacher) {
      setTeacherData(foundTeacher);
    } else {
      alert('Teacher not found');
      setTeacherData(null);
    }
  };
  

  const handleAddInfo = () => {
    if (!photoId || !selectedTeacher) {
      alert('Please enter the Photo ID');
      return;
    }

    const updatedTeachers = allTeachers.map((teacher) => {
      if (teacher.teacherId === selectedTeacher.teacherId) {
        return {
          ...teacher,
          photoId: photoId, // Update the photoId
        };
      }
      return teacher;
    });

    setAllTeachers(updatedTeachers);
    setTeacherData((prevData) => ({
      ...prevData,
      photoId: photoId, // Update the photoId in displayed data
    }));
    setShowPopup(false);
    setPhotoId('');

    handleSaveToFile();
  };

//   const handleSaveToFile = () => {
//     if (!workbook || !fileName) {
//         console.log("No workbook or file name. Exiting...");
//         return;
//     }

//     const sheetName = workbook.SheetNames[0];
//     const worksheet = workbook.Sheets[sheetName];

//     // Loop through all teachers to update their corresponding rows in the worksheet
//     allTeachers.forEach((teacher) => {
//         const teacherRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
//             .findIndex((row) => row[0] === teacher.teacherId); // Find the row that matches the teacher ID

//         if (teacherRow !== -1) {
//             // Update the corresponding cells directly
//             const rowIndex = teacherRow + 1; // Adding 1 to convert to Excel's 1-based indexing
//             worksheet[`A${rowIndex}`] = { v: teacher.teacherId }; // Update Teacher ID (if necessary)
//             worksheet[`B${rowIndex}`] = { v: teacher.teacherName }; // Update Teacher Name
//             worksheet[`C${rowIndex}`] = { v: teacher.cameraId }; // Update Camera ID
//             worksheet[`D${rowIndex}`] = { v: teacher.photoId || '' }; // Update Photo ID
//         }
//     });

//     // Write the updated workbook
//     const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
//     const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

//     // Send the updated file to the backend
//     fetch(`http://localhost:3001/update/${encodeURIComponent(fileName)}`, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ updatedData: XLSX.utils.sheet_to_json(worksheet, { header: 1 }) }), // Send updatedData as JSON string
//     })
//     .then(response => response.text())
//     .then(result => {
//         console.log("Response from backend:", result);
//         alert(result);
//     })
//     .catch(error => {
//         console.error('Error updating file:', error);
//     });
// };

const handleSaveToFile = () => {
  if (!workbook || !fileName) {
    console.log("No workbook or file name. Exiting...");
    return;
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Extract the existing data as an array of arrays (excluding headers)
  const existingData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  console.log("Existing data before update:", existingData);

  // Prepare the updated data array
  const updatedData = existingData.map((row, index) => {
    const teacher = allTeachers.find((t) => t.teacherId === row[0]); // Find the teacher by ID

    // Update only the photoId if teacher is found
    if (teacher) {
      return [
        teacher.teacherId,        // Teacher ID
        teacher.teacherName,      // Teacher Name
        teacher.cameraId,         // Camera ID
        teacher.photoId || '',    // Updated Photo ID, ensuring it's set or empty
      ];
    }

    // If teacher not found, return the original row
    return row;
  });

  console.log("Final updated data:", updatedData);

  // Create a new worksheet from the updated data
  const newWorksheet = XLSX.utils.aoa_to_sheet(updatedData);

  // Replace the old sheet with the updated one
  workbook.Sheets[sheetName] = newWorksheet;

  // Write the updated workbook
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

  // Send the updated file to the backend
  console.log("Sending updated data to backend...");
  fetch(`http://localhost:3001/update/${encodeURIComponent(fileName)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ updatedData }), // Send updatedData directly as JSON
  })
    .then((response) => response.text())
    .then((result) => {
      console.log("Response from backend:", result);
      alert(result);
    })
    .catch((error) => {
      console.error('Error updating file:', error);
    });
};




  return (
    <div className="bg-white shadow-lg rounded-lg p-6 md:p-8 lg:p-12 max-w-5xl mx-auto">
      <h2 className="text-xl md:text-2xl font-bold mb-6">Teacher Management</h2>

      <h3 className="text-xl font-semibold">Upload Teachers Data Excelsheet and Select Details</h3>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="mb-6"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="nameDropdown" className="block text-sm md:text-base lg:text-lg font-medium mb-2">
            Teacher Name
          </label>
          <select
            id="nameDropdown"
            name="nameDropdown"
            value={formData.nameDropdown}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 text-base md:text-lg lg:text-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select an option</option>
            {allTeachers.map((teacher) => (
              <option key={teacher.teacherId} value={teacher.teacherName}>
                {teacher.teacherName}
              </option>
            ))}
          </select>
        </div>


        <div>
          <label htmlFor="cameraIdInput" className="block text-sm md:text-base lg:text-lg font-medium mb-2">
            Camera ID
          </label>
          <input
            id="cameraIdInput"
            name="cameraIdInput"
            type="text"
            value={formData.cameraIdInput}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 text-base md:text-lg lg:text-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>



        <div>
          <label htmlFor="teacherIdInput" className="block text-sm md:text-base lg:text-lg font-medium mb-2">
            Teacher ID
          </label>
          <input
            id="teacherIdInput"
            name="teacherIdInput"
            type="text"
            value={formData.teacherIdInput}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 text-base md:text-lg lg:text-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!formData.nameDropdown || !formData.cameraIdInput }
            className={`w-full bg-blue-500 text-white p-3 text-sm md:text-base lg:text-lg font-medium rounded-md ${
              (!formData.nameDropdown || !formData.cameraIdInput )
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-blue-600'
            }`}
          >
            Find Teacher
          </button>
        </div>
      </form>

      {/* {teacherData && (
        <div className="mt-8 p-6 border border-gray-200 rounded-md">
          <h3 className="text-lg md:text-xl font-bold mb-4">Teacher Information</h3>
          <p><strong>Teacher ID:</strong> {teacherData.teacherId}</p>
          <p><strong>Name:</strong> {teacherData.teacherName}</p>
          
          {teacherData.photo && (
            <img src={teacherData.photo} alt="Teacher" className="mt-4 rounded-md shadow-md" />
          )}
          <button
            className="mt-4 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
            onClick={() => {
              setSelectedTeacher(teacherData);
              setShowPopup(true);
            }}
          >
            Add Photo ID
          </button>
        </div>
      )} */}

{teacherData && (
  <div className="mt-8">
    <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-4">Found Teacher</h3>
    <div className="mb-4 flex justify-between items-center">
      <span>{teacherData.teacherName} (ID: {teacherData.teacherId})</span>
      <button
        onClick={() => {
          setShowPopup(true);
          setSelectedTeacher(teacherData);
        }}
        className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
      >
        Add Photo ID
      </button>
    </div>
  </div>
)}


      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Add Photo ID</h3>
            <input
              type="text"
              value={photoId}
              onChange={(e) => setPhotoId(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter Photo ID"
            />
            <div className="flex justify-end space-x-4 mt-4">
              <button
                
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={handleAddInfo}
                // onClick={handleSaveToFile}
              >
                Save
              </button>
              <button
                className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                onClick={() => setShowPopup(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )} 
{/* 
{showPopup && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
            <h4 className="text-lg md:text-xl lg:text-2xl font-bold mb-4">Enter Photo ID</h4>
            <input
              type="text"
              value={photoId}
              onChange={(e) => setPhotoId(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-base md:text-lg lg:text-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter Photo ID"
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleAddInfo}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Save
              </button>
              <button
                onClick={() => setShowPopup(false)}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )} */}




      {/* <button
        onClick={handleSaveToFile}
        className="mt-6 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
      >
        Save to File
      </button> */}
    </div>
  );
}

export default TeacherDataComponent;
