import { Router, Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { requireAuth } from '../middlewares/auth.js';
import { QuestionGeneratorService } from '../services/questionGenerator.service.js';
import { AnswerKeyGeneratorService } from '../services/answerKeyGenerator.service.js';
import { PDFGeneratorService } from '../services/pdfGenerator.service.js';

const router = Router();

// Create new Question Paper draft
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      title,
      institutionName,
      examName,
      subjectName,
      boardName,
      standardOrSemester,
      academicYear,
      examDate,
      durationMinutes,
      totalMarks,
      difficultyDistribution, // { mode, basicPercentage, mediumPercentage, hardPercentage }
      patternConfig, // array of SectionPlan
      instructionsText,
      syllabusDocId,
    } = req.body;

    // Validate marks mathematically
    const val = QuestionGeneratorService.validatePattern(
      Number(totalMarks),
      patternConfig,
      difficultyDistribution
    );

    if (!val.valid) {
      return res.status(400).json({
        success: false,
        message: 'Examination pattern validation failed.',
        errors: val.errors,
      });
    }

    const paper = await prisma.questionPaper.create({
      data: {
        title: title || `${examName} - ${subjectName}`,
        institutionName: institutionName || 'Apex Academy',
        examName,
        subjectName,
        boardName,
        standardOrSemester,
        academicYear: academicYear || '2026-2027',
        examDate,
        durationMinutes: Number(durationMinutes) || 180,
        totalMarks: Number(totalMarks),
        difficultyDistribution: JSON.stringify(difficultyDistribution),
        patternConfigJson: JSON.stringify(patternConfig),
        instructionsText,
        syllabusDocId: syllabusDocId || null,
        userId,
        status: 'DRAFT',
      },
    });

    res.status(201).json({
      success: true,
      paper,
    });
  } catch (error: any) {
    console.error('Create paper error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// List all user's question papers
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const papers = await prisma.questionPaper.findMany({
      where: { userId },
      include: {
        questions: { select: { id: true } },
        sharedLinks: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      count: papers.length,
      papers,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single question paper with questions, answer key, and audit report
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const paper = await prisma.questionPaper.findFirst({
      where: { id, userId },
      include: {
        questions: {
          include: {
            answer: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
        answerKey: {
          include: {
            items: true,
          },
        },
        auditReport: true,
        sharedLinks: true,
        syllabusDoc: {
          include: {
            units: {
              include: {
                topics: true,
              },
            },
          },
        },
      },
    });

    if (!paper) {
      return res.status(404).json({ success: false, message: 'Question paper not found.' });
    }

    res.json({ success: true, paper });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Trigger AI Question Generation for the paper
router.post('/:id/generate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const questions = await QuestionGeneratorService.generatePaperQuestions(id);

    res.json({
      success: true,
      message: 'Questions generated successfully.',
      count: questions.length,
      questions,
    });
  } catch (error: any) {
    console.error('Question generation failed:', error);
    res.status(500).json({ success: false, message: error.message || 'Generation failed.' });
  }
});

// Inline edit a question
router.put('/:id/questions/:qId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id, qId } = req.params;
    const { questionText, marks, difficulty, options, bloomLevel } = req.body;

    const updated = await prisma.question.update({
      where: { id: qId },
      data: {
        questionText,
        marks: marks ? Number(marks) : undefined,
        difficulty,
        optionsJson: options ? JSON.stringify(options) : undefined,
        bloomLevel,
      },
    });

    res.json({ success: true, question: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Regenerate single question
router.post('/:id/questions/:qId/regenerate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id, qId } = req.params;
    const updated = await QuestionGeneratorService.regenerateSingleQuestion(id, qId);
    res.json({ success: true, question: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a question
router.delete('/:id/questions/:qId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { qId } = req.params;
    await prisma.question.delete({ where: { id: qId } });
    res.json({ success: true, message: 'Question deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add custom question
router.post('/:id/questions', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sectionName, questionNumber, questionText, questionType, marks, difficulty, options, unitTag, topicTag } = req.body;

    const count = await prisma.question.count({ where: { paperId: id } });

    const q = await prisma.question.create({
      data: {
        paperId: id,
        sectionName: sectionName || 'Section A',
        questionNumber: questionNumber || count + 1,
        questionText,
        questionType: questionType || 'SHORT_ANSWER',
        marks: Number(marks) || 2,
        difficulty: difficulty || 'MEDIUM',
        unitTag,
        topicTag,
        optionsJson: options ? JSON.stringify(options) : null,
        orderIndex: count + 1,
      },
    });

    res.status(201).json({ success: true, question: q });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate Separate AI Answer Key
router.post('/:id/answer-key/generate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const answerKey = await AnswerKeyGeneratorService.generateAnswerKey(id);
    res.json({ success: true, answerKey });
  } catch (error: any) {
    console.error('Answer key generation failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Run 10-Point Quality and Accuracy Audit
router.post('/:id/audit', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const report = await AnswerKeyGeneratorService.runQualityAudit(id);
    res.json({ success: true, report });
  } catch (error: any) {
    console.error('Quality audit failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Download PDF 1: Question Paper
router.get('/:id/pdf/questions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await PDFGeneratorService.generateQuestionPaperPdf(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Question_Paper_${id.slice(0, 8)}.pdf"`);
    doc.pipe(res);
  } catch (error: any) {
    console.error('Question paper PDF error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Download PDF 2: Answer Key
router.get('/:id/pdf/answers', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await PDFGeneratorService.generateAnswerKeyPdf(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Answer_Key_${id.slice(0, 8)}.pdf"`);
    doc.pipe(res);
  } catch (error: any) {
    console.error('Answer key PDF error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create Secure Direct Sharing Link
router.post('/:id/share', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { includeAnswerKey, allowDownload, expiresDays } = req.body;

    let expiresAt: Date | undefined = undefined;
    if (expiresDays && Number(expiresDays) > 0) {
      expiresAt = new Date(Date.now() + Number(expiresDays) * 24 * 60 * 60 * 1000);
    }

    const share = await prisma.sharedLink.create({
      data: {
        paperId: id,
        includeAnswerKey: !!includeAnswerKey, // default false to protect answers from students!
        allowDownload: allowDownload !== false,
        expiresAt,
      },
    });

    res.status(201).json({
      success: true,
      shareLink: {
        id: share.id,
        shareToken: share.shareToken,
        shareUrl: `${req.protocol}://${req.get('host')}/shared/${share.shareToken}`,
        includeAnswerKey: share.includeAnswerKey,
        expiresAt: share.expiresAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete paper
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    await prisma.questionPaper.deleteMany({
      where: { id, userId },
    });
    res.json({ success: true, message: 'Question paper deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
