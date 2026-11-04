import PDFDocument from 'pdfkit';
import { prisma } from '../config/db.js';

export class PDFGeneratorService {
  /**
   * Generate Question Paper PDF stream.
   */
  public static async generateQuestionPaperPdf(paperId: string): Promise<PDFKit.PDFDocument> {
    const paper = await prisma.questionPaper.findUnique({
      where: { id: paperId },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!paper) {
      throw new Error('Question paper not found.');
    }

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 45, right: 45 },
      info: {
        Title: `${paper.title} - Question Paper`,
        Author: paper.institutionName,
        Subject: paper.subjectName,
      },
    });

    // 1. Institution Header Box
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(paper.institutionName.toUpperCase(), { align: 'center' });

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(paper.examName, { align: 'center' });

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Academic Year: ${paper.academicYear} | Board: ${paper.boardName}`, { align: 'center' });

    doc.moveDown(0.5);

    // Decorative divider line
    doc.strokeColor('#334155').lineWidth(1).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Metadata Grid (Class, Subject, Duration, Max Marks)
    const yPosMeta = doc.y;
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(`Standard / Class: `, 45, yPosMeta, { continued: true })
      .font('Helvetica')
      .text(`${paper.standardOrSemester}`);

    doc
      .font('Helvetica-Bold')
      .text(`Subject: `, 45, yPosMeta + 14, { continued: true })
      .font('Helvetica')
      .text(`${paper.subjectName}`);

    doc
      .font('Helvetica-Bold')
      .text(`Time Allowed: `, 380, yPosMeta, { continued: true })
      .font('Helvetica')
      .text(`${paper.durationMinutes} Minutes`);

    doc
      .font('Helvetica-Bold')
      .text(`Maximum Marks: `, 380, yPosMeta + 14, { continued: true })
      .font('Helvetica')
      .text(`${paper.totalMarks}`);

    doc.y = yPosMeta + 32;
    doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // 2. Student Information Block
    const yPosStudent = doc.y;
    doc
      .fontSize(8.5)
      .font('Helvetica')
      .text('Candidate Name: _________________________________', 45, yPosStudent);

    doc.text('Roll / Reg No: ___________________', 360, yPosStudent);

    doc.text('Class / Section:  _______________', 45, yPosStudent + 16);
    doc.text('Date: _______________', 360, yPosStudent + 16);

    doc.y = yPosStudent + 32;
    doc.strokeColor('#334155').lineWidth(1).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // 3. General Instructions
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('General Instructions:');

    doc
      .fontSize(8.5)
      .font('Helvetica')
      .text(
        paper.instructionsText ||
          '1. This question paper consists of compulsory and choice-based sections as outlined.\n' +
          '2. All questions are to be attempted neatly in the provided answer booklet.\n' +
          '3. Read each question carefully before attempting.\n' +
          '4. Use of scientific calculators is permitted only where explicitly mentioned.',
        { lineGap: 2 }
      );

    doc.moveDown(0.8);

    // 4. Group questions by section
    const sectionsMap = new Map<string, any[]>();
    paper.questions.forEach((q) => {
      const sec = q.sectionName || 'General Section';
      if (!sectionsMap.has(sec)) sectionsMap.set(sec, []);
      sectionsMap.get(sec)!.push(q);
    });

    sectionsMap.forEach((questions, sectionName) => {
      // Check if page needs break
      if (doc.y > 680) doc.addPage();

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text(sectionName.toUpperCase(), { align: 'center', underline: true });

      doc.moveDown(0.4);

      questions.forEach((q) => {
        if (doc.y > 720) doc.addPage();

        const qStartY = doc.y;

        // Marks badge on right
        doc
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .fillColor('#334155')
          .text(`[${q.marks} Mark${q.marks > 1 ? 's' : ''}]`, 500, qStartY, { align: 'right' });

        // Question text
        doc
          .fontSize(9.5)
          .font('Helvetica-Bold')
          .fillColor('#0f172a')
          .text(`${q.questionNumber}. `, 45, qStartY, { continued: true })
          .font('Helvetica')
          .text(q.questionText, { width: 445, lineGap: 2 });

        // MCQ options
        if (q.optionsJson) {
          try {
            const options: string[] = JSON.parse(q.optionsJson);
            doc.moveDown(0.3);
            options.forEach((opt) => {
              doc
                .fontSize(9)
                .font('Helvetica')
                .fillColor('#334155')
                .text(`     ${opt}`, { width: 440, lineGap: 1.5 });
            });
          } catch {}
        }

        doc.moveDown(0.6);
      });

      doc.moveDown(0.5);
    });

    // End of Paper marker
    doc.moveDown(1);
    doc
      .fontSize(9)
      .font('Helvetica-Oblique')
      .fillColor('#64748b')
      .text('*** END OF QUESTION PAPER ***', { align: 'center' });

    doc.end();
    return doc;
  }

  /**
   * Generate Answer Key PDF stream.
   */
  public static async generateAnswerKeyPdf(paperId: string): Promise<PDFKit.PDFDocument> {
    const paper = await prisma.questionPaper.findUnique({
      where: { id: paperId },
      include: {
        questions: {
          include: {
            answer: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!paper) {
      throw new Error('Question paper not found.');
    }

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 45, right: 45 },
      info: {
        Title: `${paper.title} - Answer Key & Marking Scheme`,
        Author: paper.institutionName,
      },
    });

    // Header
    doc
      .fontSize(15)
      .font('Helvetica-Bold')
      .text(paper.institutionName.toUpperCase(), { align: 'center' });

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#b91c1c')
      .text('OFFICIAL ANSWER KEY & MARKING SCHEME (CONFIDENTIAL)', { align: 'center' });

    doc
      .fontSize(9.5)
      .font('Helvetica')
      .fillColor('#0f172a')
      .text(
        `Subject: ${paper.subjectName} | Exam: ${paper.examName} | Max Marks: ${paper.totalMarks}`,
        { align: 'center' }
      );

    doc.moveDown(0.6);
    doc.strokeColor('#b91c1c').lineWidth(1.5).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.8);

    paper.questions.forEach((q) => {
      if (doc.y > 690) doc.addPage();

      const ans = q.answer;

      // Question Number & Text
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text(`Q${q.questionNumber} (${q.sectionName} - ${q.marks} Marks): `, { continued: true })
        .font('Helvetica-Oblique')
        .text(q.questionText.slice(0, 140) + (q.questionText.length > 140 ? '...' : ''));

      doc.moveDown(0.3);

      // Model Solution
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#15803d')
        .text('Model Answer / Solution:');

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#1e293b')
        .text(ans?.solutionText || 'Solution pending teacher entry.', {
          width: 490,
          lineGap: 2,
        });

      // Step-by-Step Marks
      if (ans?.stepByStepMarksJson) {
        try {
          const steps: { step: string; marks: number }[] = JSON.parse(ans.stepByStepMarksJson);
          if (steps.length > 0) {
            doc.moveDown(0.3);
            doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0369a1').text('Step-by-Step Marking Scheme:');
            steps.forEach((s) => {
              doc
                .fontSize(8.5)
                .font('Helvetica')
                .fillColor('#334155')
                .text(`  • ${s.step}: [${s.marks} Mark${s.marks > 1 ? 's' : ''}]`);
            });
          }
        } catch {}
      }

      // Rationale (for MCQs / Reasoning)
      if (ans?.rationaleExplanation) {
        doc.moveDown(0.3);
        doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#6b21a8').text('Explanation & Rationale:');
        doc
          .fontSize(8.5)
          .font('Helvetica')
          .fillColor('#475569')
          .text(ans.rationaleExplanation, { width: 490, lineGap: 1.5 });
      }

      doc.moveDown(0.6);
      doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.6);
    });

    doc.moveDown(1);
    doc
      .fontSize(9)
      .font('Helvetica-Oblique')
      .fillColor('#64748b')
      .text('*** END OF ANSWER KEY & MARKING SCHEME ***', { align: 'center' });

    doc.end();
    return doc;
  }
}
