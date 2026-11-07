# LabWise Urdu — AI-Powered Medical Report Explainer

LabWise Urdu is an open-source, full-stack medical report analyzer designed to improve health literacy in bilingual communities. Users can upload diagnostic laboratory documents (PDFs, PNGs, JPGs) and receive instant, plain-language summaries in both English and Urdu, alongside color-coded biomarker evaluations, a secure patient history portal, and an administrative management console.

---

## 🌟 Key Features

* **📄 Document Ingestion Pipeline:** Drag-and-drop or upload PDF reports and lab image scans up to 5MB.
* **🔍 Hybrid OCR Extraction Engine:** Dual-pass text extraction utilizing pure JavaScript `pdf2json` for vector PDFs and `tesseract.js` for image-based lab scans.
* **🧠 Gemini AI Biomarker Structuring:** Automatically isolates test names, result values, standard measurement units, and reference ranges into structured JSON arrays.
* **🚥 Dynamic Value Flagging:** Color-coded status badges instantly flag abnormal indicators (Red for `HIGH`, Yellow for `LOW`, Green for `NORMAL`).
* **🇵🇰 Bilingual Summaries with RTL Support:** One-click toggle between English and Urdu explanations, complete with native Right-to-Left (RTL) typography formatting.
* **🔒 Role-Based Access Control (RBAC) & JWT Auth:** Secure registration and authentication with dual role modes (`user` and `admin`), featuring JWT tokens, `bcryptjs` encryption, and dynamic user badges.
* **🛡️ Dedicated Admin Management Console:** Built-in administrative dashboard allowing designated admins to review all registered user accounts, toggle user roles (`user` ↔ `admin`), and oversee system metrics in real time.
* **📜 Unified Diagnostic Logs:** Standard users view private diagnostic test records, while administrators access comprehensive system-wide diagnostic histories across all accounts.
* **🧪 Automated Test Suite:** Integrated Jest and Supertest test suite verifying OCR string sanitization, Gemini LLM API mocks, and RESTful route health endpoints.
* **⚠️ Prominent Safety Disclaimers:** Visible medical disclaimers on every view emphasizing that analyses are strictly for educational guidance rather than formal clinical diagnosis.

---

## 🏗️ Architecture & Tech Stack

```text
[ React Frontend ]  <--->  [ Express / Node.js API ]  <--->  [ Google Gemini API ]
 (Tailwind / CSS)                 |                            (LLM Structuring)
                                  +---> [ pdf2json / Tesseract.js ] (OCR Pipeline)
                                  +---> [ MongoDB Atlas DB ]       (Users & Reports)

---

### 1. Frontend: React.js (v18+), Context API (AuthContext), React Router, CSS3 with native RTL Typography Support.

### 2. Backend: Node.js, Express.js, Multer (File Upload Handling), JWT (JSON Web Tokens), BcryptJS, RBAC Middleware

### 3. Database: MongoDB Atlas (Mongoose ODM).

### 4. AI & OCR: Google Gemini 1.5/2.0 Flash API, pdf2json, tesseract.js.

### 5. Testing Suite: Jest, Supertest, jest-environment-node.
```
---

## 🚀 Getting Started

## Prerequisites

1. Node.js (v18 or higher)

2. MongoDB running locally or a MongoDB Atlas cluster URL

3. Google AI Studio API Key

---

## 📥 Installation & Setup

### Clone the Repository:

1. git clone https://github.com/FaisalShahbaz383/LabWise-Urdu.git
2. cd LabWise-Urdu

---

### Configure Backend:

1. cd backend
2. npm install

---

### Create a .env file inside backend/:

1. PORT=5000
2. MONGO_URI=mongodb://localhost:27017/medical_reports
3. JWT_SECRET=your_super_secret_jwt_key
4. JWT_EXPIRE=30d
5. GEMINI_API_KEY=your_google_gemini_api_key

---

### Configure Frontend:

1. cd ../frontend
2. npm install

---

### 💻 Running Locally

### Start the Backend Server:

1. cd backend
2. npm start
### or for development: npm run dev

---

### Start the Frontend Application:

1. cd frontend
2. npm start

---

### 🧪 Automated Testing Suite

### To execute the Jest unit and integration test suites:

1. cd backend
2. npm test

Executes unit tests for OCR string parsing (ocrService.test.js), Gemini AI structuring mocks (aiService.test.js), and API route responses (reportRoutes.test.js).

---

### Open your browser and navigate to http://localhost:3000.

## 🧪 Deployment Architecture

### 1. Frontend: Deployed on Vercel (REACT_APP_API_URL pointing to Render).

### 2. Backend: Deployed on Render (Node.js Web Service).

### 3. Database: Hosted on MongoDB Atlas M0 Free Tier.

---

## 🛡️ Medical Safety Disclaimer

Educational Tool Only: LabWise Urdu is an automated literacy assistant designed solely to clarify medical terminology and reference ranges. It does NOT provide medical advice, formal clinical diagnosis, or treatment plans. Always consult a licensed healthcare professional or certified physician regarding medical diagnostic results.

---

# 🔒 License & Intellectual Property Warning

## PROPRIETARY & ALL RIGHTS RESERVED — VIEW-ONLY CODEBASE
### Copyright (c) 2026 Faisal Shahbaz. All Rights Reserved.

This repository, including all underlying source code, software architecture, UI design assets, unit tests, and backend APIs, is published solely for evaluation, portfolio review, and assessment demonstration purposes.

1. No License Granted: No license (express or implied) is granted to any individual, company, educational institution, or organization to copy, modify, distribute, publish, host, re-license, sell, or create derivative works from this software, in whole or in part.

2. Prohibition of Unauthorized Commercial / Organizational Use: Unauthorized commercial exploitation, private hosting, redistribution, or inclusion of this project into third-party commercial software, training modules, or services without explicit written consent from the author is strictly prohibited.

3. Reservation of Rights: The author reserves the right to restrict access, set repository visibility to Private, or take formal intellectual property enforcement actions regarding unauthorized copying or deployment.
