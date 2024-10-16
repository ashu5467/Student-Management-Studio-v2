//15 oct

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const ExcelJS = require('exceljs');
const PSD = require('psd');
const { exec } = require('child_process');
const { PDFDocument,StandardFonts, rgb ,degrees} = require('pdf-lib');
const XLSX = require('xlsx');
const sharp = require('sharp');
const pathConfig = require('./Paths');
const paths = require('./Paths'); 

const folderNames = ['1', '2', '3', '4'];


const app = express();
const PORT = 5000;

// Directories
const imagesDirectory = pathConfig.imagesDirectory;
const documentsDirectory = pathConfig.documentsDirectory;
const updateDocsDirectory = pathConfig.updateDocsDirectory;


// Ensure the documents directory exists
if (!fs.existsSync(documentsDirectory)) {
  console.log(`Creating documents directory at ${documentsDirectory}`);
  fs.mkdirSync(documentsDirectory, { recursive: true });
}



app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001','http://192.168.1.7:3000'], // Allow both frontend URLs
  }));

// Serve static files (e.g., images) from the specific folder

app.use('/images', express.static(imagesDirectory));

app.use(express.json());

// API route to check if an image exists with different extensions
app.get('/check-image/:imageName', (req, res) => {
  const imageName = req.params.imageName;
  console.log(`Received request to check image: ${imageName}`);

  // List of possible image extensions
  const possibleExtensions = ['jpg', 'jpeg', 'png', 'gif','JPG','JPEG','PNG','GIF'];

  let imageFound = false;
  let imageUrl = '';

  // Iterate over possible extensions to check if the file exists
  for (const extension of possibleExtensions) {
    const imagePath = path.join(imagesDirectory, `${imageName}.${extension}`);
    console.log(`Checking for image at path: rrr ${imagePath}`);

    if (fs.existsSync(imagePath)) {
      console.log(`Image found at path: ${imagePath}`);
      imageFound = true;
      imageUrl = `/images/${imageName}.${extension}`;
      break;
    } else {
      console.log(`Image not found at path: ${imagePath}`);
    }
  }

  if (imageFound) {
    console.log(`Image found: ${imageName} with URL: ${imageUrl}`);
    res.json({ message: 'Image found', url: imageUrl });
  } else {
    console.error(`Image not found: ${imageName}`);
    res.status(404).json({ message: 'Image not found' });
  }
});


// API route to create a new sheet in an existing Excel file
app.post('/create-excel/:imageName', async (req, res) => {
  const imageName = req.params.imageName;
  const { board, classname, section, studentData ,schoolNumber,cameraId} = req.body; // Added studentData

  console.log('Received request body:', req.body);

  if (!Array.isArray(studentData)) {
    console.error('Invalid studentData:', studentData);
    return res.status(400).json({ message: 'Invalid student data' });
  }

  const excelFileName = `Students_Excel_sheet_for_Magazine.xlsx`; // Use a fixed filename
  const excelFilePath = path.join(updateDocsDirectory, excelFileName); // Save at the specified directory


  const possibleExtensions = ['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG'];

  let imagePath = '';
  let imageFound = false;

  // Check if image exists with any of the possible extensions
  let newImageDirectory = imagesDirectory.replace('schoolNum',schoolNumber)
  console.log('newImageDirectory>>>>>',newImageDirectory)
  for (const ext of possibleExtensions) {
    const tempImagePath = path.join(newImageDirectory+cameraId, `${imageName}.${ext}`);
    console.log("tampimagepath>>>>>",tempImagePath)
    if (fs.existsSync(tempImagePath)) {
      imagePath = tempImagePath;
      imageFound = true;
      break;
    }
  }

  if (!imageFound) {
    console.error(`Image not found with any extension for base name: ${imageName}`);
    return res.status(404).json({ message: 'Image not found' });
  }

  console.log(`Received request to add a new sheet to Excel for image: ${imageName}`);
  console.log(`Image found at path: ${imagePath}`);

  const rowNames = ['Front Row (R-L)', 'Row 1', 'Row 2', 'Row 3', 'Row 4', 'Row 5'];

  let workbook;

  // Check if the Excel file exists; if so, load it, otherwise create a new one
  if (fs.existsSync(excelFilePath)) {
    console.log('Loading existing Excel workbook.');
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelFilePath);
  } else {
    console.log('Creating a new Excel workbook.');
    workbook = new ExcelJS.Workbook();
  }

  // Define a new sheet name based on the request data (board, class, section)
  const sheetName = `${schoolNumber}_${board}_${classname}_${section}`;

  // Check if a sheet with the same name already exists
  const existingSheet = workbook.getWorksheet(sheetName);
  if (existingSheet) {
    console.error(`Sheet with the name ${sheetName} already exists.`);
    return res.status(400).json({ message: 'Sheet with this name already exists' });
  }

  const worksheet = workbook.addWorksheet(sheetName);

  const noteCell = worksheet.getCell('C1');
  noteCell.value = 'NOTE: Any corrections done to spellings/details should be highlighted in RED BOLD';
  noteCell.font = {
    bold: true,
    color: { argb: 'FF0000' } // Red color
  };

  const imageId = workbook.addImage({
    filename: imagePath,
    extension: imagePath.split('.').pop(),
  });


  worksheet.getCell('Z1').value = imagePath;

    // Hide the entire column B
    worksheet.getColumn('Z').hidden = true;

  const startRowForImage = 2;
  worksheet.addImage(imageId, {
    tl: { col: 0, row: 2 },
    ext: { width: 500, height: 300 }
  });




  console.log(`Adding row names in column I, starting from row ${startRowForImage}`);
  const numberOfRowsImageCovers = 6;

  rowNames.forEach((rowName, index) => {
    worksheet.getCell(`I${startRowForImage + index}`).value = rowName;
  });

  // Adding student names and individual photos
  let currentPhotoColumn = 1;
  let currentNameRow = 25;
  let photocolumn = 2;

  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'JPG', 'JPEG', 'PNG', 'GIF'];

  // Loop over each student in studentData
  for (const student of studentData) {
    let individualImageFound = false;
    let individualPhotoPath = '';



    const studentPhotoName = [];
    // Check for each possible extension for individual photos
    let newIndividualPhotosDirectory = pathConfig.individualPhotosDirectory.replace('schoolNum',schoolNumber)
    console.log('newIndividualPhotosDirectory>>>',newIndividualPhotosDirectory)
    for (const ext of imageExtensions) {
      const tempPath = path.join(newIndividualPhotosDirectory+cameraId, `${student.individualPhotoId}.${ext}`);
      console.log('temppath>>>>',tempPath)
      if (fs.existsSync(tempPath)) {
        individualPhotoPath = tempPath;
        individualImageFound = true;
        break;
      }
    }

    
    let cell = `Z${photocolumn}`;

    if (individualImageFound) {
      worksheet.getCell(currentNameRow + 1, currentPhotoColumn + 1).value = student.name;
      worksheet.getCell(cell).value = individualPhotoPath+'>'+student.name;
      const individualImageId = workbook.addImage({
        filename: individualPhotoPath,
        extension: individualPhotoPath.split('.').pop(),
      });
      worksheet.addImage(individualImageId, {
        tl: { col: currentPhotoColumn, row: currentNameRow - 5 },
        ext: { width: 100, height: 100 }
      });

      console.log(`Added photo for student ${student.name} at column ${currentPhotoColumn} and row ${currentNameRow - 5}`);
    } else {
      console.warn(`Individual photo not found for student: ${student.name}`);
    }
    photocolumn++;

    currentPhotoColumn += 3;
    if (currentPhotoColumn > 10) {
      currentPhotoColumn = 1;
      currentNameRow += 5;
    }
  }

  try {
    // Write back to the same Excel file (with multiple sheets)
    await workbook.xlsx.writeFile(excelFilePath);
    console.log(`Excel file updated with a new sheet at ${excelFilePath}`);
    res.json({ message: 'New sheet added to Excel file', fileUrl: `/images/${path.parse(imageName).name}.xlsx` });
  } catch (error) {
    console.error('Error updating Excel file:', error);
    res.status(500).json({ message: 'Error updating Excel file' });
  }
});




// Function to check for image existence with different extensions
function findPhotoWithExtension(photoBasePath) {
  const extensions = ['jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'PNG'];
  for (const ext of extensions) {
    const photoPath = `${photoBasePath}.${ext}`;
    if (fs.existsSync(photoPath)) {
      return photoPath;
    }
  }
  return null;
}
app.post('/create-magazine', async (req, res) => {
  const { SchoolNumber,board, className, section } = req.body;
  const excelFilePath = path.join(updateDocsDirectory, 'Students_Excel_sheet_for_Magazine.xlsx');
  const excelFileName = `Students_Excel_sheet_for_Magazine.xlsx`; // Use a fixed filename
  
  const insidePsdPath = pathConfig.insidePsdPath;
  const outsidePsdPath = pathConfig.outsidePsdPath;
  const outputPdfPath = pathConfig.outputPdfPath;
  const finalPdfDirectory = pathConfig.finalPdfDirectory;
  const sheetName = `1_${board}_${className}_${section}`;


  try {
      // Load the Excel file
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(excelFilePath);
      
      // Get the first worksheet (assuming there's only one sheet)
      const worksheet = workbook.getWorksheet('1_CBSE_PG_A');
      if (!worksheet) {
          console.error(`Worksheet not found.`);
          return res.status(404).json({ message: 'Worksheet not found' });
      }

      console.log(`Loaded worksheet.`);

      let GroupPhotoPath;
      
await getColumnZValues(excelFilePath, sheetName).then(columnZValues => {
  
   GroupPhotoPath = columnZValues;
}).catch(error => {
  console.error('Error:', error);
});

  
console.log(GroupPhotoPath,'>>>>')    



      // Extract group photo name from A3
      const groupPhotoName = worksheet.getCell('Z1').value; // e.g., "Picture 1"
      console.log(`Group photo name extracted from Excel/////: ${groupPhotoName}`);

      // Check if the groupPhotoName is valid
      if (!groupPhotoName) {
          console.warn('Group photo name is null or undefined.');
      }

      // Find the group photo in the specified directory
      
      const groupPhotoPath = groupPhotoName;
      console.log(`Searching for group photo in: ${imagesDirectory}`);
      
      if (!groupPhotoPath) {


          console.error(`Group photo "${groupPhotoName}" not found.`);
          return res.status(404).json({ message: 'Group photo not found' });
      } else {
          console.log(`Group photo found at: ${groupPhotoPath}`);
      }

      // Extract row details (I2:J7)
      const rowDetails = {};
      for (let rowNum = 2; rowNum <= 7; rowNum++) {
          const detailKey = worksheet.getCell(`I${rowNum}`).value;
          const detailValue = worksheet.getCell(`J${rowNum}`).value;

          // Log details being extracted
          console.log(`Extracting detail from row ${rowNum}: Key: ${detailKey}, Value: ${detailValue}`);

          rowDetails[detailKey] = detailValue;
      }
      console.log(`Extracted row details: ${JSON.stringify(rowDetails)}`);

      // Initialize variables for looping through columns and rows for student names and photos
      const columns = ['Z'];  // Columns where student data is located
      let nameStartRow = 2; // Row where student names start
      let photoStartRow = 21; // Row where individual photos start
      const studentData = [];  // Array to store student data

      let hasMoreStudents = true;  // Flag to check if more students are available

      // Loop through rows to extract all students' names and photos
      
          // Loop through the columns (B, E, H) for student data
         

      let z=0
      // Generate magazine for each student
      for (const student of GroupPhotoPath) {

        console.log(student)
        console.log(z)
        if (z>0 && student!=null ){
          let studentdata = student.split('>')
          console.log(studentdata,">>")
          
          const individualPhotoPath = studentdata[0];
          const IndividualStudentName = studentdata[1];
          
          
          let newFinalPdfDirectory = finalPdfDirectory.replace('schoolNum',SchoolNumber)
          console.log('newFinalPdfDirectory>>>>>',newFinalPdfDirectory)
          const finalPdfPath = path.join(newFinalPdfDirectory, `${SchoolNumber}_${IndividualStudentName}_${className}_${section}.pdf`);

          // Modify the Inside and Outside PSD with the student and group photos
          let newInsidePsdPath = insidePsdPath.replace('schoolNum',SchoolNumber)
          console.log('newInsidePsdPath>>>',newInsidePsdPath)
          const insidePsd = PSD.fromFile(newInsidePsdPath);
          insidePsd.parse();
          await replaceImageInPSD(insidePsd, groupPhotoPath, 'Group Layer Name');

          const outputPath1 = path.join(pathConfig.BASE, 'inside_modified.png');

          await insidePsd.image.saveAsPng(outputPath1);

          let newImageOutsidePsdPath = outsidePsdPath.replace('schoolNum',SchoolNumber)
          console.log('newImageOutsidePsdPath>>>',newImageOutsidePsdPath)
          const outsidePsd = PSD.fromFile(newImageOutsidePsdPath);
          outsidePsd.parse();
          await replaceImageInPSD(outsidePsd, individualPhotoPath, 'Individual Layer Name');

          const outputPath2 = path.join(pathConfig.BASE,'outside_modified.png')
          await outsidePsd.image.saveAsPng(outputPath2);


          let newOutputpdfPath = outputPdfPath.replace('schoolNum',SchoolNumber)
          console.log('newOutputpdfPath391>>>',newOutputpdfPath)

          // Convert to PDF and insert photos
          const convertCommand = `convert /home/vishal/Desktop/inside_modified.png /home/vishal/Desktop/outside_modified.png ${newOutputpdfPath}`;
          await new Promise((resolve, reject) => {
              exec(convertCommand, (err, stdout, stderr) => { 
                  if (err) {
                      console.error('Error during PDF conversion:', stderr);
                      reject(err);
                  } else {
                      console.log('PDF created successfully:', stdout);
                      resolve();
                  }
              });
          });

         

          // Add student data, images, and row details to the PDF
          let newOutputPdfPath = outputPdfPath.replace('schoolNum',SchoolNumber)
          console.log('newnewOutputPdfPath>>>407',newOutputPdfPath);
          await addPhotosToPdf(newOutputPdfPath, groupPhotoPath, individualPhotoPath, finalPdfPath, IndividualStudentName, className, section, rowDetails);
      }
      z++;
    }
      res.json({ success: true, message: 'Magazines created successfully!' });

  } catch (error) {
      console.error('Error processing magazine:', error);
      res.status(500).json({ success: false, message: 'Error creating magazine' });
  }
});




// Function to add photos, text, and row details to the PDF
async function addPhotosToPdf(outputPdfPath, groupPhotoPath, individualPhotoPath, finalPdfPath, name, className, section, rowDetails,SchoolNumber) {
  try {



      console.log(`Loading PDF from path: ${outputPdfPath}`);
      let newOutputPdfPath = outputPdfPath.replace('schoolNum',SchoolNumber)
          console.log('newOutputPdfPath>>>',newOutputPdfPath)
      const pdfDoc = await PDFDocument.load(fs.readFileSync(newOutputPdfPath));
      
      // Embed the images
      console.log(`Embedding group photo from path: ${groupPhotoPath}`);
      const groupPhotoImage = await pdfDoc.embedJpg(fs.readFileSync(groupPhotoPath));
      console.log(`Group photo embedded successfully.`);

      console.log(`Embedding individual photo from path: ${individualPhotoPath}`);
      const individualPhotoImage = await pdfDoc.embedJpg(fs.readFileSync(individualPhotoPath));
      console.log(`Individual photo embedded successfully.`);

      // Add photos to the first page of the PDF
      const page = pdfDoc.getPage(0); 
      console.log(`Adding group photo to the PDF.`);
      page.drawImage(groupPhotoImage, {
          x: 4950,
          y: 120,
          width: 3300,
          height: 1800,
          rotate: degrees(90)
      });

      const page1 = pdfDoc.getPage(1); 
      console.log(`Adding individual photo to the PDF.`);
      page1.drawImage(individualPhotoImage, {
          x: 3300,
          y: 850,
          width: 1500,
          height: 1800,
      });

      // Add student details (name, class, section)
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 100;
      console.log(`Adding student details to the PDF.`);
      page1.drawText(`Name: ${name}`, {
          x: 3300,
          y: 750,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
      });
      page1.drawText(`Class: ${className}`, {
          x: 3300,
          y: 650,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
      });
      page1.drawText(`Section: ${section}`, {
          x: 3300,
          y: 550,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
      });

      // Add row details from Excel
      const rowDetailXStart = 5050
      const rowDetailYStart = 450; // Starting Y position for row details
      const lineSpacing = 35; 
      let currentX = rowDetailXStart;
      //let currentY = rowDetailYStart;
      for (const [key, value] of Object.entries(rowDetails)) {
          page.drawText(`${key}: ${value}`, {
              // x: 5200,
              x: currentX,
              size: 30,
              font,
              color: rgb(0, 0, 0),
              rotate: degrees(90),
              // rotate: degrees(90),
              // height: 4000,
              // width: 6000,
              y: 120,
          });
          
          //currentY -= lineSpacing;
          currentX += lineSpacing  // Adjust Y position for the next detail
      }

      console.log('Attempting to read image from:', groupPhotoPath);


      // Save the modified PDF
      console.log(`Saving the final PDF to path: ${finalPdfPath}`);
      fs.writeFileSync(finalPdfPath, await pdfDoc.save());
      console.log(`Final PDF created at ${finalPdfPath}`);
  } catch (error) {
      console.error('Error while adding photos to PDF:', error);
      throw error; // Ensure we propagate the error up the call stack
  }
}

// Helper function to replace the image in a PSD
async function replaceImageInPSD(psd, imagePath, layerName) {
  try {
      console.log(`Attempting to replace image in PSD with image from path: ${imagePath}`);
      
      // Adjust the path to the correct layer in the PSD
      const layer = psd.tree().childrenAtPath(layerName)[0]; // Use layerName to find the correct layer
      if (layer) {
          console.log(`Found layer: ${layer.name}. Replacing image...`);
          
          // Logic to replace the layer's image with a new one
          const newImage = await PSD.fromFile(imagePath).image; // Load the new image
          layer.image.replaceImage(newImage);
          console.log(`Image replaced in layer: ${layer.name}`);
      } else {
          //console.warn('Layer not found. Make sure the layer path is correct.');
      }
  } catch (error) {
      console.error('Error replacing image in PSD:', error);
      throw error;
  }
}



async function extractImagesFromExcel(filePath, sheetName) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const worksheet = workbook.getWorksheet(sheetName);
    if (!worksheet) {
        console.error(`Worksheet "${sheetName}" not found.`);
        return;
    }

    const images = worksheet.getImages();
    if (images.length === 0) {
        console.log('No images found in the sheet.');
        return;
    }

    for (const image of images) {
        const imageId = image.id;
        const imagePath = path.join(__dirname, `image_${imageId}.png`);

        // Convert image to a buffer
        const imageBuffer = await sharp(image.buffer)
            .resize(200) // Resize if necessary
            .toBuffer();

        // Write the image buffer to a file
        fs.writeFileSync(imagePath, imageBuffer);
        console.log(`Image saved at: ${imagePath}`);
    }

    console.log(`Extracted ${images.length} images from the sheet.`);
}



async function getColumnZValues(filePath, sheetName) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.getWorksheet(sheetName);
  if (!worksheet) {
      console.error(`Worksheet "${sheetName}" not found.`);
      return;
  }

  const columnZValues = [];
  
  worksheet.eachRow((row, rowNumber) => {
      const cellValue = row.getCell('Z').value; // Get the value of column Z in the current row
      columnZValues.push(cellValue);
  });

  return columnZValues;
}

app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
