import { Router, Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { PDFGeneratorService } from '../services/pdfGenerator.service.js';

const router = Router();

// View shared paper (Public student portal)
router.get('/share/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const share = await prisma.sharedLink.findUnique({
      where: { shareToken: token },
      include: {
        paper: {
          include: {
            questions: {
              include: {
                answer: true,
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    if (!share) {
      return res.status(404).json({ success: false, message: 'This examination link is invalid or has been revoked.' });
    }

    if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
      return res.status(410).json({ success: false, message: 'This examination link has expired.' });
    }

    // Increment view count asynchronously
    prisma.sharedLink.update({
      where: { id: share.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    // Sanitize question data if answer key is NOT shared with students
    const sanitizedQuestions = share.paper.questions.map((q) => ({
      id: q.id,
      sectionName: q.sectionName,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      questionType: q.questionType,
      marks: q.marks,
      options: q.optionsJson ? JSON.parse(q.optionsJson) : undefined,
      // If includeAnswerKey is false, answer is omitted entirely
      answer: share.includeAnswerKey ? q.answer : undefined,
    }));

    res.json({
      success: true,
      share: {
        id: share.id,
        allowDownload: share.allowDownload,
        includeAnswerKey: share.includeAnswerKey,
        expiresAt: share.expiresAt,
      },
      paper: {
        title: share.paper.title,
        institutionName: share.paper.institutionName,
        examName: share.paper.examName,
        subjectName: share.paper.subjectName,
        boardName: share.paper.boardName,
        standardOrSemester: share.paper.standardOrSemester,
        academicYear: share.paper.academicYear,
        durationMinutes: share.paper.durationMinutes,
        totalMarks: share.paper.totalMarks,
        instructionsText: share.paper.instructionsText,
        questions: sanitizedQuestions,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Download student PDF directly from public share link
router.get('/share/:token/pdf', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const share = await prisma.sharedLink.findUnique({
      where: { shareToken: token },
    });

    if (!share) {
      return res.status(404).json({ success: false, message: 'Link not found.' });
    }

    if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
      return res.status(410).json({ success: false, message: 'Link expired.' });
    }

    if (!share.allowDownload) {
      return res.status(403).json({ success: false, message: 'PDF downloading has been restricted by the educator.' });
    }

    const doc = await PDFGeneratorService.generateQuestionPaperPdf(share.paperId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Question_Paper.pdf"`);
    doc.pipe(res);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
