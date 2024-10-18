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
//const pathConfig = require('./Paths');
const os = require('os');




 


const app = express();
const server = http.createServer(app); // Create an HTTP server
const io = socketIo(server); // Attach socket.io to the server





const homeDirectory = os.homedir();

// Define path configurations using the home directory
const pathConfig = {
  BASE: path.join(homeDirectory, 'Desktop'), // Base path pointing to Desktop
  imagesDirectory: path.join(homeDirectory, 'Desktop', 'School_Studio', 'schoolNum', 'Group_Photos'),
  documentsDirectory: path.join(homeDirectory, 'Desktop', 'School_Studio', 'schoolNum', 'Group_Photos', 'Group_Photo_Documents'),
  updateDocsDirectory: path.join(homeDirectory, 'Desktop', 'student management studio docs'),
  individualPhotosDirectory: path.join(homeDirectory, 'Desktop', 'School_Studio', 'schoolNum', 'Individual_Photos'),
  insidePsdPath: path.join(homeDirectory, 'Desktop', 'School_Studio', 'schoolNum', 'Magazine', 'Templates', 'Inside_sheet.psd'),
  outsidePsdPath: path.join(homeDirectory, 'Desktop', 'School_Studio', 'schoolNum', 'Magazine', 'Templates', 'Outside_sheet.PSD'),
  outputPdfPath: path.join(homeDirectory, 'Desktop', 'School_Studio', 'schoolNum', 'Magazine', 'Templates', 'output.pdf'),
  finalPdfDirectory: path.join(homeDirectory, 'Desktop', 'School_Studio', 'schoolNum', 'Magazine', 'Individual_Magazines'),
  insideModifiedPath: path.join(homeDirectory, 'Desktop', 'inside_modified.png'),
  outsideModifiedPath: path.join(homeDirectory, 'Desktop', 'outside_modified.png'),
  outputpdfPath: path.join(homeDirectory, 'Desktop', 'output.pdf')
};

module.exports = pathConfig;




// Use the home directory to construct paths
const BASE_PATH = path.join(homeDirectory, 'Desktop'); // Desktop path
const IMAGES_DIR = path.join(BASE_PATH, 'School_Studio', 'schoolNum', 'Group_Photos');
const GROUP_PHOTOS_DIR = path.join(BASE_PATH, 'School_Studio', 'schoolNum', 'Group Photos');
const INDIVIDUAL_PHOTO_PATH = path.join(BASE_PATH, 'School_Studio', 'schoolNum', 'Individual_Photos');
const INSIDE_PSD_PATH = path.join(BASE_PATH, 'School_Studio', 'Templates', 'Inside sheet.psd');
const OUTSIDE_PSD_PATH = path.join(BASE_PATH, 'School_Studio', 'schoolNum', 'Magazine', 'Templates', 'Outside sheet.psd');
const SAVE_PATH = path.join(BASE_PATH, 'School_Studio', 'schoolNum', 'Magazine', 'Individual_Magazines');
const UPLOAD_PATH = path.join(BASE_PATH, 'student management studio docs');

module.exports = {
  IMAGES_DIR,
  GROUP_PHOTOS_DIR,
  INDIVIDUAL_PHOTO_PATH,
  INSIDE_PSD_PATH,
  OUTSIDE_PSD_PATH,
  SAVE_PATH,
  UPLOAD_PATH
};






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
  const paths = require('./Paths'); 

  console.log("app.post('/update/:fileName',>>>321")

  console.log('updateDocsDirectory:>>>', pathConfig.updateDocsDirectory);

  // Specify the path where the file should be updated
  const filePath = path.join(pathConfig.updateDocsDirectory, fileName);
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




function getLocalIp() {
  const networkInterfaces = os.networkInterfaces();
  for (const interface in networkInterfaces) {
    for (const details of networkInterfaces[interface]) {
      if (details.family === 'IPv4' && !details.internal) {
        return details.address;
      }
    }
  }
  return 'localhost';  // Fallback in case IP is not found
}

app.get('/get-ip', (req, res) => {
  const interfaces = os.networkInterfaces();
  let ipAddress;

  for (const interfaceKey in interfaces) {
    for (const iface of interfaces[interfaceKey]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ipAddress = iface.address;
        break;
      }
    }
    if (ipAddress) break;
  }

  res.json({ ip: ipAddress || 'No IP address found' });
});





// Start the server 
const PORT = 3001;
server.listen(PORT, '0.0.0.0',() => {
  console.log(`Server is running on port ${PORT}`);
});
