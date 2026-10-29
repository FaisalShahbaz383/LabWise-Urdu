# LabWise Urdu — AI-Powered Medical Report Explainer

LabWise Urdu is an open-source, full-stack medical report analyzer designed to improve health literacy in bilingual communities. Users can upload diagnostic laboratory documents (PDFs, PNGs, JPGs) and receive instant, plain-language summaries in both English and Urdu, alongside color-coded biomarker evaluations and a secure medical history portal.

## 🌟 Key Features

### 📄 Document Ingestion Pipeline: Drag-and-drop or upload PDF reports and lab image scans up to 5MB.

### 🔍 Hybrid OCR Extraction: Uses pure JavaScript pdf2json for vector PDFs and tesseract.js for image-based lab scans.

### 🧠 Gemini AI Biomarker Structuring: Automatically isolates test names, result values, standard measurement units, and reference ranges into structured tabular data.

### 🚥 Dynamic Value Flagging: Color-coded status badges instantly flag abnormal indicators (Red for HIGH, Yellow for LOW, Green for NORMAL).

### 🇵🇰 Bilingual Summaries with RTL Support: One-click toggle between English and Urdu explanations, complete with native Right-to-Left (RTL) typography.

### 🔒 JWT User Authentication: Secure register/login system enabling users to save, manage, and review their diagnostic test history over time.

### ⚠️ Prominent Safety Disclaimers: Visible medical disclaimers on every page emphasizing that analyses are for educational guidance rather than formal diagnosis.

## 🏗️ Architecture & Tech Stack

[ React Frontend ]  <--->  [ Express / Node.js API ]  <--->  [ Google Gemini API ]
 (Tailwind / CSS)                 |                                (LLM Analysis)
                                  +---> [ pdf2json / Tesseract.js ] (OCR Engine)
                                  +---> [ MongoDB Atlas DB ]       (Users & Reports)


### 1. Frontend: React.js, Context API, CSS3 (RTL Support)

### 2. Backend: Node.js, Express.js, Multer (File Ingestion), JWT, BcryptJS

### 3. Database: MongoDB / MongoDB Atlas (Mongoose ODM)

### 4. AI & OCR: Google Gemini 1.5/2.0 API, pdf2json, tesseract.js

## 🚀 Getting Started

## Prerequisites

Node.js (v18 or higher)

MongoDB running locally or a MongoDB Atlas cluster URL

Google AI Studio API Key

## 📥 Installation & Setup

### Clone the Repository:

git clone https://github.com/YourUsername/LabWise-Urdu.git
cd LabWise-Urdu


### Configure Backend:

cd backend
npm install


### Create a .env file inside backend/:

PORT=5000
MONGO_URI=mongodb://localhost:27017/medical_reports
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=30d
GEMINI_API_KEY=your_google_gemini_api_key


### Configure Frontend:

cd ../frontend
npm install


### 💻 Running Locally

Start the Backend Server:

cd backend
npm start
# or for development: npm run dev


### Start the Frontend Application:

cd frontend
npm start


### Open your browser and navigate to http://localhost:3000.

## 🧪 Deployment Architecture

### 1. Frontend: Deployed on Vercel (REACT_APP_API_URL pointing to Render).

### 2. Backend: Deployed on Render (Node.js Web Service).

### 3. Database: Hosted on MongoDB Atlas M0 Free Tier.

## 🛡️ Medical Safety Disclaimer

Educational Tool Only: LabWise Urdu is an automated literacy assistant designed solely to clarify medical terminology and reference ranges. It does NOT provide medical advice, diagnosis, or treatment plans. Always consult a licensed healthcare professional or certified physician regarding medical test results.

## 📄 License

Distributed under the MIT License. See LICENSE for more information.
