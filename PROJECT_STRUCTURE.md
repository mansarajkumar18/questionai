# Q-GEN AI — Project Directory Structure

```
d:\Q_gen_ai/
│
├── .gitignore                          # Global Git ignore specifications
├── README.md                           # Master product overview & quickstart
├── PROJECT_STRUCTURE.md                # Complete folder and file layout reference
├── ARCHITECTURE.md                     # Technical architecture & subsystem designs
├── ENVIRONMENT_SETUP.md                # Environment variable configuration & setup
│
├── client/                             # Independent React 18 + Vite Frontend Application
│   ├── .env                            # Client environment variables
│   ├── .env.example                    # Client environment template
│   ├── index.html                      # HTML5 entry with Google Fonts (Inter, Noto Sans Tamil)
│   ├── package.json                    # Frontend dependencies & build scripts
│   ├── postcss.config.js               # PostCSS plugins configuration
│   ├── tailwind.config.js              # Tailwind CSS theme, colors, typography
│   ├── tsconfig.json                   # TypeScript client compiler configuration
│   ├── tsconfig.node.json              # TypeScript Vite config runner
│   ├── vite.config.ts                  # Vite bundler, HMR, and backend reverse proxy
│   └── src/
│       ├── main.tsx                    # React DOM entry point
│       ├── App.tsx                     # Top-level router and layout shell
│       ├── index.css                   # Tailwind directives and print styles
│       ├── types.ts                    # Universal TypeScript data interfaces
│       ├── components/                 # Reusable layout and navigation components
│       │   ├── Layout.tsx              # Responsive two-column SaaS shell
│       │   ├── Navbar.tsx              # Top navigation bar with institution status
│       │   └── Sidebar.tsx             # 8-item primary navigation sidebar
│       ├── context/                    # React Context providers
│       │   └── AuthContext.tsx         # JWT token management and user state
│       ├── services/                   # Frontend API communication
│       │   └── api.ts                  # Axios client with JWT request/response interceptors
│       └── pages/                      # Application route pages
│           ├── Auth/
│           │   ├── Login.tsx           # Teacher sign-in page
│           │   └── Register.tsx        # Institution workspace registration
│           ├── Dashboard.tsx           # SaaS dashboard with recent papers & syllabi
│           ├── CreatePaper/
│           │   └── CreateWizard.tsx    # 3-Step Question Paper creation wizard
│           ├── Papers/
│           │   ├── PapersList.tsx      # Table of all generated examination papers
│           │   └── PaperWorkbench.tsx  # Teacher interactive paper editing & export workbench
│           ├── Syllabus/
│           │   └── SyllabusLibrary.tsx # Uploaded syllabi repository & text viewer
│           ├── QuestionBank/
│           │   └── QuestionBank.tsx    # Searchable universal question repository
│           ├── AnswerKeys/
│           │   └── AnswerKeysList.tsx  # Confidential answer key repository
│           ├── Shared/
│           │   ├── SharedManager.tsx   # Management portal for active share links
│           │   └── PublicSharedView.tsx# Student public examination view
│           ├── Profile/
│           │   └── UserProfile.tsx     # Educator credentials and institution info
│           └── Settings.tsx            # AI Provider key configuration & live connection test
│
└── server/                             # Independent Node.js + Express + TypeScript Backend
    ├── .env                            # Backend local environment configuration
    ├── .env.example                    # Backend environment template
    ├── package.json                    # Backend dependencies & scripts
    ├── tsconfig.json                   # TypeScript server compiler configuration
    ├── test-e2e.ts                     # Automated end-to-end verification test suite
    ├── prisma/                         # Database ORM Layer
    │   ├── schema.prisma               # 13 Complete database entity models
    │   ├── dev.db                      # Local SQLite database (ACID compliant)
    │   └── seed.ts                     # Standard board & pattern blueprint seeder
    ├── uploads/                        # Dedicated directory for uploaded syllabus files
    └── src/
        ├── index.ts                    # Express server initialization & middleware stack
        ├── config/
        │   └── db.ts                   # Prisma client singleton & connection lifecycle
        ├── middlewares/
        │   ├── auth.ts                 # JWT Bearer token authentication middleware
        │   └── errorHandler.ts         # Centralized API error handling middleware
        ├── routes/
        │   ├── health.routes.ts        # GET /api/health & /api/v1/health endpoints
        │   ├── auth.routes.ts          # /api/v1/auth registration, login, profile
        │   ├── boards.routes.ts        # /api/v1/boards educational boards & blueprints
        │   ├── syllabus.routes.ts      # /api/v1/syllabus upload, OCR, AI analysis
        │   ├── papers.routes.ts        # /api/v1/papers generation, workbench, PDF export
        │   ├── publicShare.routes.ts   # /api/v1/public student examination access
        │   └── settings.routes.ts      # /api/v1/settings AI key & provider configuration
        └── services/                   # Modular service architecture
            ├── index.ts                # Unified service export hub
            ├── auth/
            │   └── auth.service.ts     # Password hashing & JWT token services
            ├── syllabus/
            │   ├── syllabusParser.service.ts   # PDF & Tesseract.js OCR text extraction
            │   └── syllabusAnalyzer.service.ts # AI curriculum structuring engine
            ├── ai/
            │   └── aiProvider.service.ts       # Google Gemini SDK modular adapter
            ├── question/
            │   └── questionGenerator.service.ts# Blueprint validator & question synthesis
            ├── answer/
            │   └── answerKeyGenerator.service.ts# 1:1 answer key & 10-point quality audit
            ├── pdf/
            │   └── pdfGenerator.service.ts     # Academic Question Paper & Answer Key PDF engine
            └── sharing/
                └── sharing.service.ts          # Public link generator & student security filter
```

