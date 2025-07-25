const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// 🧠 Use multer with correct storage (retains file extension)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});

const upload = multer({ storage });

// 🧪 Test Route
app.get('/', (req, res) => {
  res.send('API is working!');
});

// 📄 Certificate Generation Route
app.post('/generate-certificate', upload.single('bgImage'), (req, res) => {
  const { name, course, date } = req.body;
  const bgImagePath = req.file?.path;

  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => {
    const result = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${name.split(' ').join('_')}_certificate.pdf`);
    res.send(result);

    // 🧹 Delete uploaded background image after sending PDF
    if (bgImagePath && fs.existsSync(bgImagePath)) {
      fs.unlink(bgImagePath, (err) => {
        if (err) console.error('Failed to delete uploaded image:', err);
      });
    }
  });

  // 🖼 Set background image (full-page)
  if (bgImagePath && fs.existsSync(bgImagePath)) {
    doc.image(bgImagePath, 0, 0, { width: doc.page.width, height: doc.page.height });
  } else {
    console.error("⚠️ No background image provided or path is invalid.");
  }

  // ✍️ Add text content (adjust Y positions if needed)
  doc
    .fillColor('black')
    .fontSize(24)
    .text('Certificate of Completion', 50, 150, { align: 'center' })
    .moveDown()
    .fontSize(18)
    .text('This certifies that', { align: 'center' })
    .moveDown()
    .fontSize(22)
    .text(name, { align: 'center' })
    .moveDown()
    .fontSize(18)
    .text('has successfully completed the course', { align: 'center' })
    .moveDown()
    .fontSize(20)
    .text(`"${course}"`, { align: 'center' })
    .moveDown()
    .text(`on ${date}`, { align: 'center' });

  doc.end();
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

