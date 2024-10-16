




// server.js paths

const path = require('path');

// Use an environment variable or a default value
const BASE_PATH = process.env.BASE_PATH || '/home/vishal/Desktop'; // Change the default path if needed

const IMAGES_DIR = ('/home/vishal/Desktop/School_Studio/schoolNum/Group_Photos/');
const GROUP_PHOTOS_DIR = ('home/vishal/Desktop/School_Studio/schoolNum/Group Photos');
const INDIVIDUAL_PHOTO_PATH = ('/home/vishal/Desktop/School_Studio/schoolNum/Individual_Photos/');
const INSIDE_PSD_PATH = ( 'School_Studio//home/vishal/Desktop/Magazine/Templates/Inside sheet.psd');
const OUTSIDE_PSD_PATH = ( 'School_Studio/schoolNum/Magazine/Templates/Outside sheet.psd');
const SAVE_PATH = ( 'School_Studio/schoolNum/Magazine/Individual_Magazines');
const UPLOAD_PATH = ( '/home/vishal/Desktop/student management studio docs');

module.exports = {
  
  IMAGES_DIR,
  GROUP_PHOTOS_DIR,
  INDIVIDUAL_PHOTO_PATH,
  INSIDE_PSD_PATH,
  OUTSIDE_PSD_PATH,
  SAVE_PATH,
  UPLOAD_PATH
};



//index.js paths

const basePath = '/home/vishal/Desktop/School_Studio/schoolNum';

// Define path configurations using the base path
const pathConfig = {
  BASE :('/home/vishal/Desktop'),
  imagesDirectory: ('/home/vishal/Desktop/School_Studio/schoolNum/Group_Photos/'),
  documentsDirectory: ('/home/vishal/Desktop/School_Studio/schoolNum/Group_Photos/Group_Photo_Documents'),
  updateDocsDirectory: ('/home/vishal/Desktop/student management studio docs'),
  individualPhotosDirectory:('/home/vishal/Desktop/School_Studio/schoolNum/Individual_Photos/'),
  insidePsdPath: ('/home/vishal/Desktop/School_Studio/schoolNum/Magazine/Templates/Inside_sheet.psd'),
  outsidePsdPath: ('/home/vishal/Desktop/School_Studio/schoolNum/Magazine/Templates/Outside_sheet.PSD'),
  outputPdfPath: ('/home/vishal/Desktop/School_Studio/schoolNum/Magazine/Templates/output.pdf'),
  finalPdfDirectory: ('/home/vishal/Desktop/School_Studio/schoolNum/Magazine/Individual_Magazines/')
};

module.exports = pathConfig;