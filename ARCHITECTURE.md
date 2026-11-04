# Q-GEN AI — Technical Architecture Specification

## 1. System Topology

```
+---------------------------------------------------------------------------+
|                              CLIENT LAYER                                 |
|  React 18 + TypeScript + Vite + Tailwind CSS + Lucide + Context + Axios   |
+---------------------------------------------------------------------------+
                                     |
                                REST API
                                (Bearer JWT)
                                     v
+---------------------------------------------------------------------------+
|                          BACKEND API GATEWAY                              |
|          Express.js + TypeScript + Helmet + CORS + Error Handler          |
+---------------------------------------------------------------------------+
         |                                                 |
         v                                                 v
+-----------------------+                         +-------------------------+
|   MODULAR SERVICES    |                         |    PERSISTENCE LAYER    |
| - AuthService         |                         |  Prisma ORM             |
| - SyllabusParser      |                         |  SQLite (dev.db)        |
| - SyllabusAnalyzer    |                         |  Local Secure Storage   |
| - AIProvider          |                         +-------------------------+
| - QuestionGenerator   |                                      |
| - AnswerKeyGenerator  |                                      v
| - PDFGenerator        |                         +-------------------------+
| - SharingService      |                         |  13 RELATIONAL ENTITIES |
+-----------------------+                         |  User, Institution,     |
         |                                        |  Board, Subject,        |
         v                                        |  SyllabusDocument,      |
+-----------------------+                         |  SyllabusUnit, Topic,   |
|   EXTERNAL PROVIDER   |                         |  ExamTemplate, Paper,   |
|  Google Gemini API    |                         |  Question, AnswerKey,   |
|  (Official SDK)       |                         |  SharedLink, Audit      |
+-----------------------+                         +-------------------------+
```

## 2. Core Architectural Principles

### 1. Complete Project Isolation
- Completely independent codebase, configuration, and dependencies.
- No shared packages, shared environment variables, or database links with any other application.
- Self-contained execution runtimes for both frontend and backend.

### 2. Separation of Concerns
- **Client Layer:** Focused purely on state presentation, user interactions, wizard steps, and responsive layout.
- **API Routing Layer:** Validates HTTP parameters, sanitizes inputs, enforces authorization, and handles HTTP status codes.
- **Service Layer:** Houses all business rules, AI prompting logic, document parsing, mathematical validation, and PDF formatting.
- **Persistence Layer:** Type-safe database queries via Prisma Client with guaranteed transactions and migrations.

### 3. Security & Student Data Protection
- Passwords hashed using `bcryptjs` with salt factor 10.
- API authentication enforced using industry-standard signed JWT tokens.
- **Student Exam Separation:** Public shared links (`/api/v1/public/share/:token`) execute a security filter that completely strips `AnswerKey` records before serialization, ensuring students can never view or inspect answer keys in network responses or DOM inspectors.
- API keys stored securely in `.env` or in the SQLite database (`SystemSetting`), never sent to the browser unmasked.

### 4. Mathematical Determinism in Examination Blueprints
- Real-time mathematical validator ensures:
  $$\sum (\text{questions} \times \text{marksPerQuestion}) = \text{totalMarks}$$
- Disallows question generation when section marks do not equal examination total marks.
- Difficulty modes enforce a strict 100% total distribution across Basic, Medium, and Hard categories.
