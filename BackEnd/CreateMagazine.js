app.post('/create-magazine', async (req, res) => {
    const { board, className, section } = req.body;
    const excelFilePath = path.join(updateDocsDirectory, 'Students_Excel_sheet_for_Magazine.xlsx');
    const excelFileName = `Students_Excel_sheet_for_Magazine.xlsx`; // Use a fixed filename
    
    const insidePsdPath = `/home/vishal/Desktop/School_Studio_imgs/1/Magazine/Templates/Inside_sheet.psd`;
    const outsidePsdPath = `/home/vishal/Desktop/School_Studio_imgs/1/Magazine/Templates/Outside_sheet.PSD`;
    const outputPdfPath = `/home/vishal/Desktop/School_Studio_imgs/1/Magazine/Templates/output.pdf`;
    const finalPdfDirectory = `/home/vishal/Desktop/School_Studio_imgs/1/Magazine/Individual_Magazines/`;
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
  
    
  
    
      
  
  
  
        // Extract group photo name from A3
        const groupPhotoName = worksheet.getCell('Z1').value; // e.g., "Picture 1"
        console.log(`Group photo name extracted from Excel/////: ${groupPhotoName}`);
  
        // Check if the groupPhotoName is valid
        if (!groupPhotoName) {
            console.warn('Group photo name is null or undefined.');
        }
  
        // Find the group photo in the specified directory
        //const groupPhotoPath = findPhotoByName(`/home/vishal/Desktop/School_Studio_imgs/1/Group_Photos/Cam1/`, groupPhotoName);
        const groupPhotoPath = groupPhotoName;
        console.log(`Searching for group photo in: /home/vishal/Desktop/School_Studio_imgs/1/Group_Photos/Cam1/`);
        
        if (!groupPhotoPath) {
            console.error(`Group photo "${groupPhotoName}" not found.`);
            return res.status(404).json({ message: 'Group photo not found' });
        } else {
            console.log(`Group photo found at: ${groupPhotoPath}`);
        }
  
        // Extract row details (I2:J8)
        const rowDetails = {};
        for (let rowNum = 2; rowNum <= 8; rowNum++) {
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
       
            let studentsInRow = 0;  // Track number of students in the current row
  
            // Loop through the columns (B, E, H) for student data
            
                const studentName = worksheet.getCell(`Z${photocolumn}`).value;
               
                const individualPhotoId = worksheet.getCell(`${col}${photoStartRow}`).value;
  
                // Log student name and individual photo ID
                console.log(`Extracting from row ${nameStartRow}: Student Name: ${studentName}, Photo ID: ${individualPhotoId}`);
  
                
            
  
        
        
        // Generate magazine for each student
        for (const student of studentData) {
            const individualPhotoPath = findPhotoWithExtension(`/home/vishal/Desktop/School_Studio_imgs/1/Individual_Photos/Cam1/${student.individualPhotoId}`);
            if (!individualPhotoPath) {
                console.error(`Individual photo not found for student: ${student.name}`);
                continue;
            }
  
            console.log(`Individual photo found for student ${student.name} at: ${individualPhotoPath}`);
            const finalPdfPath = path.join(finalPdfDirectory, `${student.name}_${className}_${section}.pdf`);
  
            // Modify the Inside and Outside PSD with the student and group photos
            const insidePsd = PSD.fromFile(insidePsdPath);
            insidePsd.parse();
            await replaceImageInPSD(insidePsd, groupPhotoPath, 'Group Layer Name');
            await insidePsd.image.saveAsPng('/home/vishal/Desktop/inside_modified.png');
  
            const outsidePsd = PSD.fromFile(outsidePsdPath);
            outsidePsd.parse();
            await replaceImageInPSD(outsidePsd, individualPhotoPath, 'Individual Layer Name');
            await outsidePsd.image.saveAsPng('/home/vishal/Desktop/outside_modified.png');
  
            // Convert to PDF and insert photos
            const convertCommand = `convert /home/vishal/Desktop/inside_modified.png /home/vishal/Desktop/outside_modified.png ${outputPdfPath}`;
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
            await addPhotosToPdf(outputPdfPath, groupPhotoPath, individualPhotoPath, finalPdfPath, student.name, className, section, rowDetails);
        }
  
        res.json({ success: true, message: 'Magazines created successfully!' });
  
    } catch (error) {
        console.error('Error processing magazine:', error);
        res.status(500).json({ success: false, message: 'Error creating magazine' });
    }
  });
  