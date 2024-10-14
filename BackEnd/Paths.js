




// server.js paths

const path = require('path');

// Use an environment variable or a default value
const BASE_PATH = process.env.BASE_PATH || '/home/vishal/Desktop'; // Change the default path if needed

const IMAGES_DIR = path.join(BASE_PATH, 'School_Studio_imgs/1/Group_Photos/Cam1');
const GROUP_PHOTOS_DIR = path.join(IMAGES_DIR, 'Group Photos');
const INDIVIDUAL_PHOTO_PATH = path.join(BASE_PATH, 'School_Studio_imgs/1/Individual_Photos/Cam1');
const INSIDE_PSD_PATH = path.join(BASE_PATH, 'School_Studio_imgs/1/Magazine/Templates/Inside sheet.psd');
const OUTSIDE_PSD_PATH = path.join(BASE_PATH, 'School_Studio_imgs/1/Magazine/Templates/Outside sheet.psd');
const SAVE_PATH = path.join(BASE_PATH, 'School_Studio_imgs/1/Magazine/Individual_Magazines');
const UPLOAD_PATH = path.join(BASE_PATH, 'student management studio docs');

module.exports = {
  BASE_PATH,
  IMAGES_DIR,
  GROUP_PHOTOS_DIR,
  INDIVIDUAL_PHOTO_PATH,
  INSIDE_PSD_PATH,
  OUTSIDE_PSD_PATH,
  SAVE_PATH,
  UPLOAD_PATH
};



//index.js paths

const basePath = '/home/vishal/Desktop/School_Studio_imgs/1';

// Define path configurations using the base path
const pathConfig = {
  BASE :('/home/vishal/Desktop'),
  imagesDirectory: path.join(basePath, 'Group_Photos/Cam1'),
  documentsDirectory: path.join(basePath, 'Group_Photos/Group_Photo_Documents'),
  updateDocsDirectory: path.join('/home/vishal/Desktop/student management studio docs'),
  individualPhotosDirectory: path.join(basePath, 'Individual_Photos/Cam1'),
  insidePsdPath: path.join(basePath, 'Magazine/Templates/Inside_sheet.psd'),
  outsidePsdPath: path.join(basePath, 'Magazine/Templates/Outside_sheet.PSD'),
  outputPdfPath: path.join(basePath, 'Magazine/Templates/output.pdf'),
  finalPdfDirectory: path.join(basePath, 'Magazine/Individual_Magazines/')
};

module.exports = pathConfig;