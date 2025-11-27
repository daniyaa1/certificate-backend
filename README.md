# 🛠️ Certificate Generator Backend – Node.js + Express + PDFKit

This is the backend for the Certificate Generator project. It receives file uploads (background image and CSV), processes the data, and generates personalized PDF certificates using PDFKit.

---

## 🔗 Live Backend Endpoint

The backend is deployed and handles certificate generation requests.

---

## ⚙️ Tech Stack

- Node.js
- Express.js
- Multer (for handling file uploads)
- PDFKit (for PDF generation)
- CORS (to enable frontend-backend communication)

---

## 📦 API Endpoints

### `POST /generate-certificate`
Accepts:
- Certificate background image
- CSV file with participant details

Returns:
- A downloadable PDF certificate for the student

### `GET /`
Test route — returns a simple success message to confirm server is up.

---

## 🚀 Local Setup

```bash
git clone https://github.com/your-username/your-backend-repo.git
cd backend
npm install
node index.js
