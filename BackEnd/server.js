const express = require('express');
const http = require('http'); // Required to use with socket.io
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsExtra = require('fs-extra');
const XLSX = require('xlsx');
const cors = require('cors');
const socketIo = require('socket.io'); // Import socket.io
const sharp = require('sharp'); // For image manipulation
const bodyParser = require('body-parser');
const paths = require('./Paths'); 

const app = express();
const server = http.createServer(app); // Create an HTTP server
const io = socketIo(server); // Attach socket.io to the server

const upload = multer({ dest: 'uploads/' });
app.options('*', cors()); // Pre-flight requests for all routes

// Enable CORS for all routes
app.use(cors({
  origin: '*', // Allow only requests from this origin
  methods: 'GET,POST,PUT,DELETE,OPTIONS', // Allow specific HTTP methods
  allowedHeaders: 'Content-Type,Authorization', // Allow specific headers
}));

app.use(bodyParser.json());

// Route to check if server is running
app.get('/', (req, res) => {
  res.send('Server is running');
});

app.get('/group-photo', (req, res) => {
  res.send('Group photo route is working!');
});



// Route to handle updating an existing file
app.post('/update/:fileName', upload.none(), (req, res) => {
  const fileName = req.params.fileName;
  console.log(`Received an update request for file: ${fileName}`);

  console.log("app.post('/update/:fileName',>>>321")

  // Specify the path where the file should be updated
  const filePath = path.join('/home/vishal/Desktop/student management studio docs', fileName);
  const updatedData = req.body.updatedData;

  //console.log('Received data for update:', updatedData);

  try {
    // Ensure updatedData is an array of objects
    if (!Array.isArray(updatedData) || !updatedData.every(item => typeof item === 'object')) {
      throw new Error('Updated data is not a valid JSON object or array.');
    }

    console.log('Valid JSON object received.');

    // Read the existing file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    console.log(`Reading existing file: ${filePath} and updating the sheet: ${sheetName}`);

    // Ensure headers are correct by creating them from updatedData
    const headers = Object.keys(updatedData[0] || {});

    // Converting JSON data to worksheet with headers
    const newWorksheet = XLSX.utils.json_to_sheet(updatedData, { header: headers });
    workbook.Sheets[sheetName] = newWorksheet;

    // Writing back to the file
    XLSX.writeFile(workbook, filePath);
    console.log(`File updated successfully: ${fileName} at ${filePath}`);

    res.send('File updated successfully.');
  } catch (err) {
    console.error('Error updating file:', err.message);
    res.status(500).send('Error updating file.');
  }
});

// Start the server 
const PORT = 3001;
server.listen(PORT, '0.0.0.0',() => {
  console.log(`Server is running on port ${PORT}`);
});
