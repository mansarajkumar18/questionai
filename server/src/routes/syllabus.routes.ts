import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/db.js';
import { requireAuth } from '../middlewares/auth.js';
import { SyllabusParserService } from '../services/syllabusParser.service.js';
import { SyllabusAnalyzerService } from '../services/syllabusAnalyzer.service.js';

const router = Router();

// Configure Multer storage
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext) || file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed formats: PDF, JPG, JPEG, PNG, WEBP, TXT.`));
    }
  },
});

// Upload and extract syllabus (Multi-file or Single file)
router.post('/upload', requireAuth, upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one syllabus file (PDF, JPG, PNG, WEBP).',
      });
    }

    const { subjectName, boardId, standardOrSemester, medium, instructions } = req.body;
    const userId = req.user!.id;

    let combinedText = '';
    let totalConfidence = 0;
    let anyOcrApplied = false;
    const warnings: string[] = [];

    // Process all uploaded files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await SyllabusParserService.processFile(file.path, file.mimetype);
        if (files.length > 1) {
          combinedText += `\n\n--- DOCUMENT PART ${i + 1}: ${file.originalname} ---\n\n`;
        }
        combinedText += result.text;
        totalConfidence += result.confidence;
        if (result.ocrApplied) anyOcrApplied = true;
        if (result.warning) warnings.push(`${file.originalname}: ${result.warning}`);
      } catch (err: any) {
        warnings.push(`${file.originalname}: ${err.message}`);
      }
    }

    const averageConfidence = files.length > 0 ? Math.round(totalConfidence / files.length) : 0;
    const primaryFile = files[0];

    // If text is virtually empty, advise the user
    if (combinedText.trim().length < 20) {
      warnings.push('The uploaded document appears to contain very little or no readable text. Please check the scan quality or paste the syllabus text directly.');
    }

    // Create syllabus document record
    const syllabusDoc = await prisma.syllabusDocument.create({
      data: {
        title: subjectName ? `${subjectName.trim()} Syllabus` : primaryFile.originalname,
        originalFileName: files.map((f) => f.originalname).join(', '),
        fileType: primaryFile.mimetype,
        fileSize: files.reduce((sum, f) => sum + f.size, 0),
        storagePath: primaryFile.filename,
        extractedRawText: combinedText,
        ocrConfidence: averageConfidence,
        status: combinedText.trim().length > 50 ? 'EXTRACTED' : 'PENDING',
        userId,
      },
    });

    res.status(201).json({
      success: true,
      document: {
        id: syllabusDoc.id,
        title: syllabusDoc.title,
        originalFileName: syllabusDoc.originalFileName,
        fileSize: syllabusDoc.fileSize,
        extractedRawText: syllabusDoc.extractedRawText,
        ocrConfidence: syllabusDoc.ocrConfidence,
        ocrApplied: anyOcrApplied,
        status: syllabusDoc.status,
        warnings: warnings.length > 0 ? warnings : undefined,
      },
    });
  } catch (error: any) {
    console.error('Syllabus upload error:', error);
    res.status(500).json({ success: false, message: error.message || 'File upload and extraction failed.' });
  }
});

// List all syllabus documents
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const documents = await prisma.syllabusDocument.findMany({
      include: {
        units: {
          include: {
            topics: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single syllabus document
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const document = await prisma.syllabusDocument.findFirst({
      where: { id },
      include: {
        units: {
          include: {
            topics: true,
          },
          orderBy: { unitNumber: 'asc' },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Syllabus document not found.' });
    }

    res.json({ success: true, document });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update extracted raw text (User verification and manual editing)
router.put('/:id/text', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { extractedRawText } = req.body;

    if (!extractedRawText || extractedRawText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Syllabus text cannot be empty.',
      });
    }

    const document = await prisma.syllabusDocument.updateMany({
      where: { id },
      data: {
        extractedRawText: extractedRawText.trim(),
        status: 'EXTRACTED',
      },
    });

    if (document.count === 0) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    res.json({ success: true, message: 'Syllabus text verified and saved successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete syllabus document
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const doc = await prisma.syllabusDocument.findFirst({
      where: { id },
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Delete file from disk
    const filePath = path.join(uploadDir, doc.storagePath);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {}
    }

    await prisma.syllabusDocument.delete({ where: { id } });

    res.json({ success: true, message: 'Syllabus document deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Trigger AI Syllabus Analysis Engine
router.post('/:id/analyze', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { subjectName, boardName, standardOrSemester, instructions } = req.body;

    const result = await SyllabusAnalyzerService.analyzeSyllabus(id, {
      subjectName,
      boardName,
      standardOrSemester,
      instructions,
    });

    res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('Syllabus analysis error:', error);
    res.status(500).json({ success: false, message: error.message || 'Syllabus analysis failed.' });
  }
});

// Get structured syllabus units & topics tree
router.get('/:id/structure', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const units = await prisma.syllabusUnit.findMany({
      where: { syllabusDocumentId: id },
      include: {
        topics: true,
      },
      orderBy: { unitNumber: 'asc' },
    });

    const parsedUnits = units.map((u) => ({
      ...u,
      topics: u.topics.map((t) => ({
        ...t,
        subtopics: t.subtopicsJson ? JSON.parse(t.subtopicsJson) : [],
        keyConcepts: t.keyConceptsJson ? JSON.parse(t.keyConceptsJson) : [],
        bloomLevels: t.bloomLevelsJson ? JSON.parse(t.bloomLevelsJson) : [],
      })),
    }));

    res.json({
      success: true,
      units: parsedUnits,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
