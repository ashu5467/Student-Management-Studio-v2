import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

function StudentDataComponent() {
  const [formData, setFormData] = useState({
    classDropdown: '',
    sectionDropdown: '',
    boardDropdown: '',
    cameraIdInput: '',
    studentIdInput: '',
    
  });
  const [studentData, setStudentData] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [boards, setBoards] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [photoId, setPhotoId] = useState('');
  const [fileName, setFileName] = useState('');
  const [workbook, setWorkbook] = useState(null);
  const [filteredStudents, setFilteredStudents] = useState([]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle file upload
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

      const headerRowIndex = jsonData.findIndex(row =>
        row.some(cell => cell.toString().toLowerCase().includes('id'))
      );

      if (headerRowIndex === -1) {
        alert('No "ID" column found in the uploaded Excel sheet.');
        return;
      }

      const headers = jsonData[headerRowIndex].map(cell => cell?.toString().trim().toLowerCase());
      const getColumnIndex = (columnName) => headers.indexOf(columnName.toLowerCase());

      const studentData = jsonData.slice(headerRowIndex + 1).map((row) => ({
        studentId: row[getColumnIndex('student id')] || row[getColumnIndex('id')],
        studentName: row[getColumnIndex('name')],
        class: row[getColumnIndex('class')],
        board: row[getColumnIndex('board')],
        section: row[getColumnIndex('section')],
        cameraId: row[getColumnIndex('individual camera id')],
        photo: row[getColumnIndex('individual photo id')] || row[getColumnIndex('photo')],
        groupCameraId: row[getColumnIndex('group camera id')],
        groupPhotoId: row[getColumnIndex('group photo id')],
      }));

      setAllStudents(studentData);

      const uniqueClasses = [...new Set(studentData.map(student => student.class))];
      setClasses(uniqueClasses);

      // Extract unique boards
      const uniqueBoards = [...new Set(studentData.map(student => student.board))];
      setBoards(uniqueBoards);

      if (uniqueClasses.length > 0) {
        setFormData((prevData) => ({
          ...prevData,
          classDropdown: uniqueClasses[0],
        }));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle class change to update sections dropdown
  useEffect(() => {
    if (formData.classDropdown) {
      const uniqueSections = [
        ...new Set(
          allStudents
            .filter(student => student.class?.toString().trim().toLowerCase() === formData.classDropdown?.trim().toLowerCase())
            .map(student => student.section)
        ),
      ];
      setSections(uniqueSections);
    } else {
      setSections([]);
    }
  }, [formData.classDropdown, allStudents]);

  // Handle form submission to find student
  // Handle form submission to find student
const handleSubmit = (e) => {
  e.preventDefault();

  const filtered = allStudents.filter((student) => {
    const isClassMatch =
      student.class?.toString().trim().toLowerCase() === formData.classDropdown?.trim().toLowerCase();
    const isSectionMatch =
      student.section?.toString().trim().toLowerCase() === formData.sectionDropdown?.trim().toLowerCase();
    const isBoardMatch =
      student.board?.toString().trim().toLowerCase() === formData.boardDropdown?.trim().toLowerCase();
    const isCameraIdMatch =
      student.cameraId?.toString().trim().toLowerCase() === formData.cameraIdInput?.trim().toLowerCase();
    const isStudentIdMatch =
      !formData.studentIdInput || student.studentId?.toString().trim().toLowerCase() === formData.studentIdInput?.trim().toLowerCase();

    return isClassMatch && isSectionMatch && isBoardMatch && isCameraIdMatch && isStudentIdMatch;
  });

  setFilteredStudents(filtered);
};


  // Handle adding the Individual Photo ID
  // Handle adding the Individual Photo ID
const handleAddInfo = () => {
  if (!photoId || !selectedStudent) {
    alert('Please enter the Individual Photo ID');
    return;
  }

  // Update the allStudents list
  const updatedStudents = allStudents.map((student) => {
    if (student.studentId === selectedStudent.studentId) {
      // Return the student with the updated photo ID, but keep all other data intact
      return {
        ...student,
        photo: photoId,  // Update the Individual Photo ID
      };
    }
    return student;  // Return unchanged students
  });

  setAllStudents(updatedStudents);

  // Update the selected student's photo while keeping other data intact
  setSelectedStudent((prevData) => ({
    ...prevData,
    photo: photoId,
  }));

  // Update studentData with all fields intact
  setStudentData((prevData) => ({
    ...prevData,
    studentId: selectedStudent.studentId,
    studentName: selectedStudent.studentName,
    class: selectedStudent.class,
    board: selectedStudent.board,
    section: selectedStudent.section,
    cameraId: selectedStudent.cameraId,
    photo: photoId,
    groupCameraId: selectedStudent.groupCameraId,
    groupPhotoId: selectedStudent.groupPhotoId,
      
  }));

  setShowPopup(false);
  setPhotoId('');

  handleSaveToFile();
};


  // Handle saving changes to the file
  const handleSaveToFile = () => {
    if (!workbook || !fileName) return;

    const updatedData = allStudents.map(student => ({
      'ID': student.studentId,
      'Name': student.studentName,
      'Class': student.class,
      'Board': student.board,
      'Section': student.section,
      'Individual Camera ID': student.cameraId,
      'Individual Photo ID': student.photo,
      'Group Camera ID': student.groupCameraId,
      'Group Photo ID': student.groupPhotoId,
    }));

    fetch(`http://localhost:3001/update/${encodeURIComponent(fileName)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ updatedData }),
    })
      .then(response => response.text())
      .then(result => {
        alert(result);
      })
      .catch(error => {
        console.error('Error updating file:', error);
      });
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 md:p-8 lg:p-12 max-w-5xl mx-auto">
      <h2 className="text-xl md:text-2xl font-bold mb-6">Student Management</h2>


      <h3 className="text-xl font-semibold">Upload Students Excel Datasheet and Select Details</h3>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="mb-6"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
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
            <option value="">Select a Board</option>
            {boards.map((board, index) => (
              <option key={index} value={board}>{board}</option>
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
            <option value="">Select a Section</option>
            {sections.map((section, index) => (
              <option key={index} value={section}>{section}</option>
            ))}
          </select>
        </div>

        {/* Camera ID Input */}
<div>
  <label htmlFor="cameraIdInput" className="block text-sm md:text-base lg:text-lg font-medium mb-2">
    Camera ID 
  </label>
  <input
    type="text"
    id="cameraIdInput"
    name="cameraIdInput"
    value={formData.cameraIdInput}
    onChange={handleChange}
    className="w-full border border-gray-300 rounded-md p-2 text-base md:text-lg lg:text-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
    placeholder="Enter Camera ID"
    required
  />
</div>

{/* Student ID Input (Optional) */}
<div>
  <label htmlFor="studentIdInput" className="block text-sm md:text-base lg:text-lg font-medium mb-2">
    Student ID (Optional)
  </label>
  <input
    type="text"
    id="studentIdInput"
    name="studentIdInput"
    value={formData.studentIdInput}
    onChange={handleChange}
    className="w-full border border-gray-300 rounded-md p-2 text-base md:text-lg lg:text-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
    placeholder="Enter Student ID (Optional)"
  />
</div>


        {/* Find Student Button */}
        <button
          type="submit"
          disabled={!formData.classDropdown || !formData.boardDropdown || !formData.sectionDropdown ||!formData.cameraIdInput}
          className={`w-full bg-blue-500 text-white p-3 text-sm md:text-base lg:text-lg font-medium rounded-md ${
            (!formData.classDropdown || !formData.boardDropdown || !formData.sectionDropdown || !formData.cameraIdInput)
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-blue-600'
          }`}
        >
          Find Student
        </button>
      </form>

      {filteredStudents.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-4">Found Students</h3>
          <ul>
            {filteredStudents.map((student) => (
              <li key={student.studentId} className="mb-4 flex justify-between items-center">
                <span>{student.studentName} (ID: {student.studentId})</span>
                <button
                  onClick={() => {
                    setShowPopup(true);
                    setSelectedStudent(student);
                  }}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  Add Individual Photo ID
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Popup for entering Individual Photo ID */}
      {showPopup && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
            <h4 className="text-lg md:text-xl lg:text-2xl font-bold mb-4">Enter Individual Photo ID</h4>
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
      )}

      {/* {studentData && (
        <div className="mt-8">
          <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-4">Student Data</h3>
          <p>Name: {studentData.studentName}</p>
          <p>Individual Photo ID: {studentData.photo || 'Not Added'}</p>
        </div>
      )} */}

      {/* Save to file button */}
      {/* <button
        onClick={handleSaveToFile}
        className="w-full bg-blue-500 text-white p-3 text-sm md:text-base lg:text-lg font-medium rounded-md mt-6 hover:bg-blue-600"
      >
        Save to Excel
      </button> */}
    </div>
  );
}

export default StudentDataComponent;
