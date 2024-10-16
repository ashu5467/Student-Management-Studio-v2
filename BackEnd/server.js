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

app.post('/check-photo', (req, res) => {
  const { photoId, folderPath } = req.body;
  console.log('Received request for check-photo:', { photoId, folderPath });
  
  if (photoId && folderPath) {
    
    res.json({ exists: true });
  } else {
    res.json({ exists: false });
  }
});


// Configure multer to store files in the 'uploads/' folder
const upload = multer({ dest: 'uploads/' });

// Middleware to parse JSON data
app.use(express.json());

console.log('Middleware configured and server is ready to receive requests.');

const IMAGES_DIR = paths.IMAGES_DIR;
const GROUP_PHOTOS_DIR = paths.GROUP_PHOTOS_DIR

// Helper function to search for the image in the specific folder
function findImage(cameraId, photoId) {

  console.log('cameraId:', cameraId); // For debugging
  console.log('photoId:', photoId);   // For debugging
  const folderPath = path.join(IMAGES_DIR, cameraId);
  const imagePath = path.join(folderPath, `${photoId}.jpeg`); // Assuming image format is .jpg
  return fs.existsSync(imagePath) ? imagePath : null;
}



app.post('/check-photo', (req, res) => {
  const { photoId, folderPath } = req.body;

  const photoFilePathJpg = path.join(folderPath, `${photoId}.jpg`);
  const photoFilePathJpeg = path.join(folderPath, `${photoId}.jpeg`);

  console.log(`Checking if file exists (jpg): ${photoFilePathJpg}`);
  console.log(`Checking if file exists (jpeg): ${photoFilePathJpeg}`);

  // Check for .jpg file first
  fs.access(photoFilePathJpg, fs.constants.F_OK, (errJpg) => {
    if (!errJpg) {
      console.log('File exists (jpg)');
      return res.json({ exists: true });
    }

    // If not found, check for .jpeg file
    fs.access(photoFilePathJpeg, fs.constants.F_OK, (errJpeg) => {
      if (!errJpeg) {
        console.log('File exists (jpeg)');
        return res.json({ exists: true });
      }

      // If neither is found, return exists: false
      console.error('File not found');
      return res.json({ exists: false });
    });
  });
});


// Updated route to create the Excel file with the image
app.post('/create-excel', (req, res) => {
  const { cameraId, photoId, board, class: className, section, fileName } = req.body;

  // Find the image
  const imagePath = findImage(cameraId, photoId);
  if (!imagePath) {
    return res.status(404).json({ success: false, message: 'Photo not found' });
  }

  // Create Excel file
  const newFileName = `${fileName}.xlsx`;
  const newFilePath = path.join(GROUP_PHOTOS_DIR, newFileName);

  // Create a new workbook and a worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Group Photo'); // Create worksheet with a "Photo" cell

  // Insert the photo into Excel (as an image path for simplicity)
  const image = fs.readFileSync(imagePath);
  sharp(imagePath)
    .resize({ width: 150 }) // Resize image if needed
    .toBuffer()
    .then((buffer) => {
      const imageCell = XLSX.utils.encode_cell({ r: 1, c: 0 }); // Cell A2
      worksheet[imageCell] = { t: 's', v: `Image: ${photoId}` };

      // Add rows for names
      XLSX.utils.sheet_add_aoa(worksheet, [['Row 1'], ['Row 2'], ['Row 3']], { origin: 'A3' });

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Group Photo');

      // Write the workbook to the file
      XLSX.writeFile(workbook, newFilePath);

      res.json({ success: true, message: 'Excel file created successfully' });
    })
    .catch((err) => {
      console.error('Error processing image:', err);
      res.status(500).json({ success: false, message: 'Error creating Excel file' });
    });
});

// Route to handle uploading and saving with the original filename
app.post('/upload', upload.single('file'), (req, res) => {
  console.log('Received a file upload request.');

  const file = req.file;
  if (!file) {
    console.log('No file uploaded.');
    return res.status(400).send('No file uploaded.');
  }

  console.log(`File uploaded: ${file.originalname}`);

  const fileName = file.originalname;
  const filePath = path.join(paths.UPLOAD_PATH, fileName);

  // Move the file to the desired location with the original name
  fs.rename(file.path, filePath, (err) => {
    if (err) {
      console.error('Error saving file:', err);
      return res.status(500).send('Error saving file.');
    }
    console.log(`File saved successfully as ${fileName} at ${filePath}`);
    res.send({ fileName });
  });
});


const INSIDE_PSD_PATH = paths.INSIDE_PSD_PATH;
const OUTSIDE_PSD_PATH = paths.OUTSIDE_PSD_PATH;
const GROUP_PHOTO_PATH = paths.GROUP_PHOTOS_DIR;
const INDIVIDUAL_PHOTO_PATH = paths.INDIVIDUAL_PHOTO_PATH;
const SAVE_PATH = paths.SAVE_PATH;

// Utility function to check if file exists
const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

// POST API to generate and save the magazine
app.post('/api/generate-magazine', async (req, res) => {
  const { board, class: studentClass, section, groupPhotoId, individualPhotoId } = req.body;

  try {
    // Validate that the required photos exist
    const groupPhoto = path.join(GROUP_PHOTO_PATH, `${groupPhotoId}.jpg`);
    const individualPhoto = path.join(INDIVIDUAL_PHOTO_PATH, `${individualPhotoId}.jpg`);

    if (!fileExists(groupPhoto)) {
      return res.status(404).json({ error: 'Group photo not found' });
    }
    if (!fileExists(individualPhoto)) {
      return res.status(404).json({ error: 'Individual photo not found' });
    }

    // Load the Inside and Outside PSD files
    const insidePsd = PSD.fromFile(INSIDE_PSD_PATH);
    const outsidePsd = PSD.fromFile(OUTSIDE_PSD_PATH);

    // Parse the PSD files
    await insidePsd.parse();
    await outsidePsd.parse();

    // Insert group photo into Inside PSD template
    const groupImageLayer = insidePsd.tree().childrenAtPath('Group Photo Layer')[0];
    const groupImage = await sharp(groupPhoto).resize(groupImageLayer.width, groupImageLayer.height).toBuffer();
    groupImageLayer.setImage(groupImage);

    // Insert individual photo into Outside PSD template
    const individualImageLayer = outsidePsd.tree().childrenAtPath('Individual Photo Layer')[0];
    const individualImage = await sharp(individualPhoto).resize(individualImageLayer.width, individualImageLayer.height).toBuffer();
    individualImageLayer.setImage(individualImage);

    // Export the final images from PSDs
    const insideImageBuffer = insidePsd.image.toPng();
    const outsideImageBuffer = outsidePsd.image.toPng();

    // Merge the two images (Inside and Outside) into one magazine
    const finalMagazinePath = path.join(SAVE_PATH, `${board}_${studentClass}_${section}_Magazine.png`);
    const finalMagazine = await sharp({
      create: {
        width: 1024, // Adjust size based on your needs
        height: 2048, // Assuming two pages stacked
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([
        { input: insideImageBuffer, top: 0, left: 0 },
        { input: outsideImageBuffer, top: 1024, left: 0 } // Assuming stacked layout
      ])
      .toFile(finalMagazinePath);

    // Send success response
    res.json({ message: 'Magazine created and saved successfully', path: finalMagazinePath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate magazine' });
  }
});


// Track editing sessions
let editingSessions = {};

// Socket.IO connections and real-time editing functionality
io.on('connection', (socket) => {
  console.log('A user connected');

  // Notify clients when a file is being edited
  socket.on('startEdit', (fileName) => {
    if (!editingSessions[fileName]) {
      editingSessions[fileName] = [];
    }
    editingSessions[fileName].push(socket.id);
    socket.broadcast.emit('fileInUse', { fileName, userCount: editingSessions[fileName].length });
  });

  // Handle file updates
  socket.on('updateFile', ({ fileName, updatedData }) => {
    const filePath = path.join('/home/vishal/Desktop/student management studio docs', fileName);

    try {
      // Ensure updatedData is an array of objects
      if (!Array.isArray(updatedData) || !updatedData.every(item => typeof item === 'object')) {
        throw new Error('Updated data is not a valid JSON object or array.');
      }

      console.log(`Updating file: ${fileName}`);

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

      // Notify other clients of the update
      socket.broadcast.emit('fileUpdated', { fileName, updatedData });
    } catch (err) {
      console.error('Error updating file:', err.message);
      socket.emit('updateError', { fileName, error: err.message });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected');
    for (const fileName in editingSessions) {
      editingSessions[fileName] = editingSessions[fileName].filter(id => id !== socket.id);
      if (editingSessions[fileName].length === 0) {
        delete editingSessions[fileName];
      }
      socket.broadcast.emit('fileInUse', { fileName, userCount: editingSessions[fileName].length });
    }
  });
});

// Route to handle updating an existing file
app.post('/update/:fileName', upload.none(), (req, res) => {
  const fileName = req.params.fileName;
  console.log(`Received an update request for file: ${fileName}`);

  // Specify the path where the file should be updated
  const filePath = path.join('/home/vishal/Desktop/student management studio docs', fileName);
  const updatedData = req.body.updatedData;

  console.log('Received data for update:', updatedData);

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
