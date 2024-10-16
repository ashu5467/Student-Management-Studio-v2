import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const GroupPhotoGeneration = () => {
  const [imageName, setImageName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [excelCreationStatus, setExcelCreationStatus] = useState('');
  const [classOptions, setClassOptions] = useState([]);
  const [boardOptions, setBoardOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [groupCameraIdOptions, setGroupCameraIdOptions] = useState([]);
  const [groupPhotoIdOptions, setGroupPhotoIdOptions] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedBoard, setSelectedBoard] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedGroupCameraId, setSelectedGroupCameraId] = useState('');
  const [selectedGroupPhotoId, setSelectedGroupPhotoId] = useState('');
  const [isPhotoVisible, setIsPhotoVisible] = useState(false); 
  const [studentData, setStudentData] = useState([]);
  const [excelData, setExcelData] = useState([]);
  const [schoolNumber, setSchoolNumber] = useState('');

  const handleSearch = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/check-image/${imageName}`);
      if (response.data.url) {
        setImageUrl(`http://localhost:5000${response.data.url}`);
        setError('');
        setIsPhotoVisible(true); 
      }
    } catch (error) {
      setError('Image not found');
      setImageUrl('');
      setIsPhotoVisible(false); 
    }
  };

  const handleCreateExcel = async () => {
    try {
      const board = selectedBoard;
      const classname = selectedClass;
      const section = selectedSection;
      const groupPhoto = selectedGroupPhotoId;
      const cameraId = selectedGroupCameraId;
   
   console.log("cameraid>>>>",cameraId)
      const response = await axios.post(
        `http://localhost:5000/create-excel/${imageName}`,
        {
          board: board,
          classname: classname,
          section: section,
          groupPhoto: groupPhoto,
          studentData: studentData,
          cameraId: cameraId,
          schoolNumber: schoolNumber,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
  
      if (response.data.fileUrl) {
        setExcelCreationStatus(
          `Excel file created: <a href="${response.data.fileUrl}" target="_blank">${response.data.fileUrl}</a>`
        );
      } else {
        setExcelCreationStatus('Failed to create Excel file');
      }
    } catch (error) {
      setExcelCreationStatus('Error creating Excel file');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      setExcelData(jsonData);

      const classSet = new Set();
      const boardSet = new Set();
      const sectionSet = new Set();
      const groupCameraIdSet = new Set();
      const groupPhotoIdSet = new Set();

      jsonData.forEach((row) => {
        if (row.Class) classSet.add(row.Class);
        if (row.Board) boardSet.add(row.Board);
        if (row.Section) sectionSet.add(row.Section);
        if (row['Group Camera ID']) groupCameraIdSet.add(row['Group Camera ID']);
        if (row['Group Photo ID']) groupPhotoIdSet.add(row['Group Photo ID']);
      });

      setClassOptions([...classSet]);
      setBoardOptions([...boardSet]);
      setSectionOptions([...sectionSet]);
      setGroupCameraIdOptions([...groupCameraIdSet]);
      setGroupPhotoIdOptions([...groupPhotoIdSet]);
    };
    reader.readAsBinaryString(file);
  };

  // const handleGroupPhotoIdChange = (e) => {
  //   const selectedPhotoId = e.target.value;
  //   setSelectedGroupPhotoId(selectedPhotoId);
  //   setImageName(selectedPhotoId);
  //   setIsPhotoVisible(false);
  //   searchStudentData(selectedPhotoId);
  // };

  const handleGroupPhotoIdChange = (e) => {
    const selectedPhotoId = e.target.value;
    setSelectedGroupPhotoId(selectedPhotoId);
    setImageName(selectedPhotoId);  // Update the image name for searching
    setIsPhotoVisible(false);       // Hide the image initially
    searchStudentData(selectedPhotoId);  // Trigger search for student data
  };
  



  const searchStudentData = (groupPhotoId) => {
    const filteredStudents = excelData.filter(
      (row) => row['Group Photo ID'] === groupPhotoId
    );

    const studentList = filteredStudents.map((row) => ({
      name: row.Name,
      individualPhotoId: row['Individual Photo ID'],
    }));

    setStudentData(studentList);
    console.log('this is studentList', studentList);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 md:p-8 lg:p-12 max-w-5xl mx-auto">
      <h2 className="text-xl md:text-2xl font-bold mb-6">Create Group Photo Excel Sheet</h2>

      {imageName && (
        <div>
          <p className="text-gray-600">Selected Group Photo ID: <strong>{imageName}</strong></p>
        </div>
      )}

      {error && <p className="text-red-500">{error}</p>}

      {imageUrl && isPhotoVisible && (
        <div className="text-center">
          <p className="text-green-600 mb-2">Image found:</p>
          <img src={imageUrl} alt="Found" className="max-w-full h-auto mx-auto border border-gray-300 rounded-md" />
        </div>
      )}

      {excelCreationStatus && (
        <p className="text-blue-600" dangerouslySetInnerHTML={{ __html: excelCreationStatus }}></p>
      )}

      <h3 className="text-xl font-semibold">Upload Students Data Excel sheet and Select Details</h3>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="block w-full text-sm text-gray-500 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 mb-4 p-2" />



       {/* New School Number Section */}
       <div>
        <label className="block mb-2">Enter School Number:</label>
        <input
          type="text"
          value={schoolNumber}
          onChange={(e) => setSchoolNumber(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 text-base md:text-lg lg:text-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Enter School Number"
        />
      </div>

      <div>
        <label className="block mb-2">Select Board:</label>
        <select value={selectedBoard} onChange={(e) => setSelectedBoard(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-base md:text-lg lg:text-xl focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">Select Board</option>
          {boardOptions.map((board, index) => (
            <option key={index} value={board}>
              {board}
            </option>
          ))}
        </select>
      </div>


      <div>
        <label className="block mb-2">Select Class:</label>
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-base md:text-lg lg:text-xl focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">Select Class</option>
          {classOptions.map((cls, index) => (
            <option key={index} value={cls}>
              {cls}
            </option>
          ))}
        </select>
      </div>

      

      <div>
        <label className="block mb-2">Select Section:</label>
        <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-base md:text-lg lg:text-xl focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">Select Section</option>
          {sectionOptions.map((section, index) => (
            <option key={index} value={section}>
              {section}
            </option>
          ))}
        </select>
      </div>

      {/* <div>
        <label className="block mb-2">Select Group Camera ID:</label>
        <select value={selectedGroupCameraId} onChange={(e) => setSelectedGroupCameraId(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-base md:text-lg lg:text-xl focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">Select Group Camera ID</option>
          {groupCameraIdOptions.map((cameraId, index) => (
            <option key={index} value={cameraId}>
              {cameraId}
            </option>
          ))}
        </select>
      </div> */}


<div>
  <label className="block mb-2">Enter Group Camera ID:</label>
  <input
    type="text"
    value={selectedGroupCameraId}
    onChange={(e) => setSelectedGroupCameraId(e.target.value)}
    className="w-full border border-gray-300 rounded-md p-2 text-base md:text-lg lg:text-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
    placeholder="Enter Group Camera ID"
  />
</div>


      {/* <div>
        <label className="block mb-2">Select Group Photo ID:</label>
        <select value={selectedGroupPhotoId} onChange={handleGroupPhotoIdChange} className="w-full border border-gray-300 rounded-md p-2 text-base md:text-lg lg:text-xl focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">Select Group Photo ID</option>
          {groupPhotoIdOptions.map((photoId, index) => (
            <option key={index} value={photoId}>
              {photoId}
            </option>
          ))}
        </select>
      </div> */}


<div>
  <label className="block mb-2">Enter Group Photo ID:</label>
  <input
    type="text"
    value={selectedGroupPhotoId}
    onChange={handleGroupPhotoIdChange}  // This function remains the same
    className="w-full border border-gray-300 rounded-md p-2 text-base md:text-lg lg:text-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
    placeholder="Enter Group Photo ID"
  />
</div>



      <button onClick={handleCreateExcel} style={{ marginTop: '30px' }}className="w-full bg-blue-500 text-white p-3 text-sm md:text-base lg:text-lg font-medium rounded-mdw-full bg-blue-500 text-white p-3 text-sm md:text-base lg:text-lg font-medium rounded-md mt-1">
      
        Create Excel File
      </button>
    </div>
  );
};

export default GroupPhotoGeneration;
