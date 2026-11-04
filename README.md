# Q-GEN AI — Independent AI Question Paper & Answer Key Generator

A completely standalone, professional, commercial-grade SaaS application for generating academically rigorous, mathematically verified examination question papers and detailed step-by-step answer keys.

---

## Key Highlights

- **100% Independent Standalone Architecture:** Completely isolated with its own frontend, backend, Prisma SQLite database, JWT authentication, and AI pipeline.
- **Multimodal Syllabus Ingestion & OCR:** Ingests digital and multi-page PDFs as well as scanned camera images (JPG, PNG, WEBP) using `pdf-parse` and `tesseract.js`.
- **AI Syllabus Analysis Engine:** Deconstructs raw syllabi into structured Units, Chapters, Topics, Key Concepts, and Bloom's Cognitive Taxonomy levels.
- **Mathematical Blueprint Validator:** Ensures that custom section configurations, question quantities, marks per question, and internal choices mathematically equal the examination target marks before generation.
- **AI Question Generation & Interactive Workbench:** Generates questions strictly anchored to the syllabus with unit tags, difficulty ratings, and Bloom's levels. Teachers can inline-edit, reorder, delete, add custom questions, or regenerate individual questions on the fly.
- **Separate AI Answer Key & Marking Scheme:** Generates 1:1 answer keys featuring complete model solutions, step-by-step marking rubrics for numericals, MCQ rationale explanations, and acceptable alternative answers.
- **10-Point Automated Quality & Accuracy Audit:** Validates syllabus adherence, absence of duplicate stems, cognitive depth alignment, and mark integrity before finalization.
- **Dual Academic PDF Generator:** Exports pixel-perfect, printable Question Paper and Answer Key PDFs with institution branding, student details block, and multi-page academic formatting.
- **Direct Sharing Portal:** Secure, token-based public links for students to view the paper and download the PDF while keeping the answer key securely locked.

---

## Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router DOM, Axios.
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, SQLite (`prisma/dev.db`).
- **AI Provider:** Google Gemini API (`@google/generative-ai`) with structured JSON schema outputs and modular provider adapter.
- **OCR & Document Extraction:** `pdf-parse` (digital PDF) + `tesseract.js` (scanned images & OCR).
- **PDF Generation Engine:** Pure-Node `pdfkit` academic layout engine.
- **Authentication & Security:** JWT tokens, `bcryptjs` password hashing, `helmet` security headers.

---

## Directory Structure

```
d:\Q_gen_ai/
├── client/                     # Independent React 18 + Vite Frontend
│   ├── src/
│   │   ├── components/         # Layout, Navbar, Sidebar
│   │   ├── context/            # AuthContext (JWT & User state)
│   │   ├── pages/
│   │   │   ├── Auth/           # Login & Registration
│   │   │   ├── CreatePaper/    # 3-Step Question Paper Wizard
│   │   │   ├── Papers/         # Papers List & Interactive Workbench
│   │   │   ├── Syllabus/       # Syllabus Library & Extracted Text Viewer
│   │   │   ├── QuestionBank/   # Universal Question Search & Filter
│   │   │   ├── AnswerKeys/     # Answer Keys Repository
│   │   │   ├── Shared/         # Shared Document Manager & Student Portal
│   │   │   ├── Profile/        # Educator Profile
│   │   │   ├── Settings.tsx    # Gemini API Key & Institution Branding
│   │   ├── services/           # Axios API client
│   │   └── types.ts            # Core TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── server/                     # Independent Express + TypeScript Backend
│   ├── prisma/
│   │   ├── schema.prisma       # 13 Complete database models
│   │   ├── dev.db              # SQLite Database
│   │   └── seed.ts             # Standard board & pattern blueprints seeder
│   ├── src/
│   │   ├── config/             # Database connection singleton
│   │   ├── middlewares/        # JWT auth & centralized error handler
│   │   ├── routes/             # Auth, Boards, Syllabus, Papers, Public Share, Settings
│   │   ├── services/           # AI Provider, Syllabus Parser/Analyzer, Question/Answer Generator, PDF Engine
│   │   └── index.ts            # Main server entry point
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

---

## Getting Started

### 1. Prerequisites
- Node.js v18+ or v22+
- npm v10+

### 2. Backend Setup
```bash
cd server
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```
The backend starts on `http://localhost:5000` with the API base at `http://localhost:5000/api/v1`.

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```
The frontend starts on `http://localhost:5173`.

### 4. Configuring Google Gemini API Key
You can configure your Google Gemini API key in two ways:
1. **In-App (Recommended):** Log in, navigate to **Settings**, paste your Gemini API Key in the AI Engine Provider card, select your preferred model (`gemini-2.5-flash`), and click **Test AI Connection**.
2. **Via `.env`:** Add `GEMINI_API_KEY="your_api_key_here"` in `server/.env`.

---

## Automated Verification Suite

Run the full end-to-end automated verification suite covering all 11 core product modules:
```bash
cd server
npx tsx test-e2e.ts
```
Expected output:
```
====================================================
🚀 Q-GEN AI: END-TO-END AUTOMATED VERIFICATION SUITE
====================================================
1. Health Check: ok | DB: healthy
2. Teacher Registration: PASSED
3. Testing Syllabus Ingestion & Text Extraction... PASSED
4. Testing AI Syllabus Analysis Engine... PASSED (4 Units)
5. Testing Exam Pattern & Mathematical Validator... PASSED
6. Testing AI Question Generation Pipeline... PASSED (22 Questions)
7. Testing Single Question Regeneration... PASSED
8. Testing Separate AI Answer Key & Marking Scheme... PASSED
9. Testing 10-Point Automated Quality Audit... PASSED (Score: 90%)
10. Testing Dual Academic PDF Generation... PASSED
11. Testing Secure Direct Sharing & Public Student Portal... PASSED
====================================================
🎉 ALL 11 END-TO-END PIPELINE MODULES PASSED 100%!
====================================================
```
