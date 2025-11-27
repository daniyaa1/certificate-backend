const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
// Allow overriding the port via environment (useful for deployment) and default to 5051
// 5050 was in use on this machine; choose 5051 to avoid conflicts.
const PORT = process.env.PORT || 5051;

//  Ensure 'uploads' directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Allow local development origin and the deployed frontend origin.
// In production you may want to restrict this to the exact frontend host.
app.use(cors({
  origin: [
    'http://localhost:3000', // react-scripts default dev server
    'http://127.0.0.1:3000', // local development via IP
    'https://certificate-frontend-eight.vercel.app'
  ],
  methods: ['POST', 'GET'],
}));

app.use(express.json());

//  Set up Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Use ensured folder
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});

const upload = multer({ storage });

//  Test Route
app.get('/', (req, res) => {
  res.send('API is working!');
});

//  Certificate Generation Route
app.post('/generate-certificate', upload.single('bgImage'), (req, res) => {
  console.log('Received certificate generation request');
  const { name, course, date } = req.body;
  console.log('Data:', { name, course, date });
  const bgImagePath = req.file?.path;

  if (!name || !course || !date) {
    console.error('Missing required fields');
    return res.status(400).send('Missing required fields: name, course, date');
  }

  // Validate image type if provided
  if (req.file && !['image/png', 'image/jpeg'].includes(req.file.mimetype)) {
    console.error('Invalid image format:', req.file.mimetype);
    if (bgImagePath && fs.existsSync(bgImagePath)) {
      fs.unlinkSync(bgImagePath);
    }
    return res.status(400).send('Invalid image format. Only PNG and JPEG are supported.');
  }

  try {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => {
    const result = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${name.split(' ').join('_')}_certificate.pdf`);
    res.send(result);

   
    if (bgImagePath && fs.existsSync(bgImagePath)) {
      fs.unlink(bgImagePath, (err) => {
        if (err) console.error('Failed to delete uploaded image:', err);
      });
    }
  });

  // Set background image if available
  if (bgImagePath && fs.existsSync(bgImagePath)) {
    doc.image(bgImagePath, 0, 0, { width: doc.page.width, height: doc.page.height });
  } else {
    console.error("⚠️ No background image provided or path is invalid.");
  }

  //  Add text content
  const pageWidth = doc.page.width;

  doc
    .font('Helvetica-Bold')
    .fontSize(30)
    .fillColor('#333333')
    .text('CERTIFICATE OF COMPLETION', 0, 180, { align: 'center' })
    .moveDown(1.5);

  doc
    .font('Helvetica')
    .fontSize(14)
    .fillColor('#555555')
    .text('This is to certify that', { align: 'center' })
    .moveDown(1);

  doc
    .font('Times-Bold')
    .fontSize(42)
    .fillColor('#000000')
    .text(name, { align: 'center' })
    .moveDown(0.5);

  // Decorative line under name
  doc
    .moveTo((pageWidth / 2) - 150, doc.y)
    .lineTo((pageWidth / 2) + 150, doc.y)
    .strokeColor('#aaaaaa')
    .lineWidth(1)
    .stroke()
    .moveDown(1.5);

  doc
    .font('Helvetica')
    .fontSize(14)
    .fillColor('#555555')
    .text('has successfully completed the course', { align: 'center' })
    .moveDown(1);

  doc
    .font('Helvetica-Bold')
    .fontSize(26)
    .fillColor('#333333')
    .text(course, { align: 'center' })
    .moveDown(2);

  doc
    .font('Helvetica')
    .fontSize(12)
    .fillColor('#555555')
    .text(`Awarded on ${date}`, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).send('Error generating certificate');
  }
});

//  Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

