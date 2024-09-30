// Paths.js
const path = require('path');

// Base directory
const baseDir = '/home/vishal/Desktop';

// Directories
const paths = {
    imagesDirectory: path.join(baseDir, 'School_Studio_imgs', '1', 'Group_Photos', 'Cam1'),
    documentsDirectory: path.join(baseDir, 'School_Studio_imgs', '1', 'Group_Photos', 'Group_Photo_Documents'),
    updateDocsDirectory: path.join(baseDir, 'student management studio docs'),
    individualPhotosDirectory: path.join(baseDir, 'School_Studio_imgs', '1', 'Individual_Photos', 'Cam1'),
    magazineTemplatesDirectory: path.join(baseDir, 'School_Studio_imgs', '1', 'Magazine', 'Templates'),
    outputPdfPath: path.join(baseDir, 'School_Studio_imgs', '1', 'Magazine', 'Templates', 'output.pdf'),
    finalPdfDirectory: path.join(baseDir, 'School_Studio_imgs', '1', 'Magazine', 'Individual_Magazines'),
    insidePsdPath: path.join(baseDir, 'School_Studio_imgs', '1', 'Magazine', 'Templates', 'Inside_sheet.psd'),
    outsidePsdPath: path.join(baseDir, 'School_Studio_imgs', '1', 'Magazine', 'Templates', 'Outside_sheet.PSD'),
    excelFilePath : path.join(updateDocsDirectory, 'Students_Excel_sheet_for_Magazine.xlsx'),
    // excelFileName = `Students_Excel_sheet_for_Magazine.xlsx`),
    // finalPdfDirectory = `/home/vishal/Desktop/School_Studio_imgs/1/Magazine/Individual_Magazines/`;
};

module.exports = paths;
