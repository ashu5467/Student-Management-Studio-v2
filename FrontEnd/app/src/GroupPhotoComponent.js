import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

function GroupPhotoComponent() {
  const [formData, setFormData] = useState({
    classDropdown: '',
    sectionDropdown: '',
    boardDropdown: '',
    groupCameraIdInput: '',
    groupPhotoIdInput: '',
  });
  const [allStudents, setAllStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [boards, setBoards] = useState([]);
  const [photoId, setPhotoId] = useState('');
  const [fileName, setFileName] = useState('');
  const [workbook, setWorkbook] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Handling change for ${name}: ${value}`);
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    console.log('File uploaded:', file.name);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      console.log('File data read:', data);
      const workbook = XLSX.read(data, { type: 'array' });
      setWorkbook(workbook);

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      console.log('JSON Data:', jsonData);

      const headerRowIndex = jsonData.findIndex(row =>
        row.some(cell => cell.toString().toLowerCase().includes('id'))
      );
      console.log('Header row index:', headerRowIndex);

      if (headerRowIndex === -1) {
        alert('No "ID" column found in the uploaded Excel sheet.');
        return;
      }

      const headers = jsonData[headerRowIndex].map(cell => cell?.toString().trim().toLowerCase());
      const getColumnIndex = (columnName) => headers.indexOf(columnName.toLowerCase());
      console.log('Headers:', headers);

      const studentData = jsonData.slice(headerRowIndex + 1).map((row) => ({
        studentId: row[getColumnIndex('student id')] || row[getColumnIndex('id')],
        studentName: row[getColumnIndex('name')],
        class: row[getColumnIndex('class')],
        board: row[getColumnIndex('board')],
        section: row[getColumnIndex('section')],
        cameraId: row[getColumnIndex('individual camera id')],
        groupCameraId: row[getColumnIndex('group camera id')],
        photo: row[getColumnIndex('photo id')] || row[getColumnIndex('photo')],
        groupPhotoId: row[getColumnIndex('group photo id')],
      }));

      console.log('Student data:', studentData);
      setAllStudents(studentData);

      const uniqueClasses = [...new Set(studentData.map(student => student.class))];
      const uniqueSections = [...new Set(studentData.map(student => student.section))];
      const uniqueBoards = [...new Set(studentData.map(student => student.board))];

      console.log('Unique classes:', uniqueClasses);
      console.log('Unique sections:', uniqueSections);
      console.log('Unique boards:', uniqueBoards);

      setClasses(uniqueClasses);
      setSections(uniqueSections);
      setBoards(uniqueBoards);

      if (uniqueClasses.length > 0) {
        setFormData((prevData) => ({
          ...prevData,
          classDropdown: uniqueClasses[0],
        }));
      }
      if (uniqueSections.length > 0) {
        setFormData((prevData) => ({
          ...prevData,
          sectionDropdown: uniqueSections[0],
        }));
      }
      if (uniqueBoards.length > 0) {
        setFormData((prevData) => ({
          ...prevData,
          boardDropdown: uniqueBoards[0],
        }));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle class change to update sections dropdown
  useEffect(() => {
    console.log('Class dropdown changed:', formData.classDropdown);
    if (formData.classDropdown) {
      const uniqueSections = [
        ...new Set(
          allStudents
            .filter(student => student.class?.toString().trim().toLowerCase() === formData.classDropdown?.trim().toLowerCase())
            .map(student => student.section)
        ),
      ];
      console.log('Unique sections for class:', uniqueSections);
      setSections(uniqueSections);
    } else {
      setSections([]);
    }
  }, [formData.classDropdown, allStudents]);

  // Check if the photo exists in the specified folder
  const checkPhotoExists = async (photoId, groupCameraId) => {
    console.log('Checking photo existence:', { photoId, groupCameraId });
    const folderPath = `/home/vishal/Desktop/School_Studio_imgs/1/Group_Photos/${groupCameraId}`;
    console.log('Folder path:', folderPath);

    return fetch(`http://localhost:3001/check-photo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        photoId,
        folderPath,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Photo existence response:', data);
        return data.exists;
      })
      .catch((error) => {
        console.error('Error checking photo:', error);
        return false;
      });
  };

  // Handle creating Excel and searching for the photo
  const handleCreateExcel = async () => {
    const { boardDropdown, classDropdown, sectionDropdown, groupCameraIdInput, groupPhotoIdInput } = formData;
    console.log('Creating Excel with:', { groupCameraIdInput, groupPhotoIdInput, boardDropdown, classDropdown, sectionDropdown });

    const photoExists = await checkPhotoExists(groupPhotoIdInput, groupCameraIdInput);
    console.log('Photo exists:', photoExists);

    if (photoExists) {
      setPopupMessage('Photo found');
    } else {
      setPopupMessage('Photo not found');
    }
    setShowPopup(true);

    if (photoExists) {
      const excelFileName = `1_${boardDropdown}_${classDropdown}_${sectionDropdown}`;
      console.log('Excel file name:', excelFileName);

      fetch('http://localhost:3001/create-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cameraId: groupCameraIdInput,
          photoId: groupPhotoIdInput,
          board: boardDropdown,
          class: classDropdown,
          section: sectionDropdown,
          fileName: excelFileName,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log('Create Excel response:', data);
          if (data.success) {
            alert('Excel file created successfully.');
          } else {
            alert('Error creating Excel file.');
          }
        })
        .catch((error) => {
          console.error('Error creating Excel file:', error);
        });
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 md:p-8 lg:p-12 max-w-5xl mx-auto">
      <h2 className="text-xl md:text-2xl font-bold mb-6">Group Photo Management</h2>

      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="mb-6"
      />

      <form className="space-y-6">
        {/* Board Dropdown */}
        <div>
          <label htmlFor="boardDropdown" className="block text-sm md:text-base lg:text-lg font-medium mb-2">
            Board
          </label>
          <select
            id="boardDropdown"
            name="boardDropdown"
            value={formData.boardDropdown}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 text-base md:text-lg lg:text-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select a board</option>
            {boards.map((board, index) => (
              <option key={index} value={board}>{board}</option>
            ))}
          </select>
        </div>

        {/* Class Dropdown */}
        <div>
          <label htmlFor="classDropdown" className="block text-sm md:text-base lg:text-lg font-medium mb-2">
            Class
          </label>
          <select
            id="classDropdown"
            name="classDropdown"
            value={formData.classDropdown}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 text-base md:text-lg lg:text-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select a class</option>
            {classes.map((cls, index) => (
              <option key={index} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        {/* Section Dropdown */}
        <div>
          <label htmlFor="sectionDropdown" className="block text-sm md:text-base lg:text-lg font-medium mb-2">
            Section
          </label>
          <select
            id="sectionDropdown"
            name="sectionDropdown"
            value={formData.sectionDropdown}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 text-base md:text-lg lg:text-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select a section</option>
            {sections.map((section, index) => (
              <option key={index} value={section}>{section}</option>
            ))}
          </select>
        </div>

        {/* Group Camera ID Input */}
        <div>
          <label htmlFor="groupCameraIdInput" className="block text-sm md:text-base lg:text-lg font-medium mb-2">
            Group Camera ID
          </label>
          <input
            type="text"
            id="groupCameraIdInput"
            name="groupCameraIdInput"
            value={formData.groupCameraIdInput}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 text-base md:text-lg lg:text-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Group Photo ID Input */}
        <div>
          <label htmlFor="groupPhotoIdInput" className="block text-sm md:text-base lg:text-lg font-medium mb-2">
            Group Photo ID
          </label>
          <input
            type="text"
            id="groupPhotoIdInput"
            name="groupPhotoIdInput"
            value={formData.groupPhotoIdInput}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 text-base md:text-lg lg:text-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Create Excel File Button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleCreateExcel}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md text-lg"
          >
            Create Excel File
          </button>
        </div>
      </form>

      {/* Popup for photo found/not found */}
      {showPopup && (
        <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-800 bg-opacity-75 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <p className="text-xl font-semibold mb-4">{popupMessage}</p>
            <button
              className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
              onClick={() => setShowPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupPhotoComponent;
