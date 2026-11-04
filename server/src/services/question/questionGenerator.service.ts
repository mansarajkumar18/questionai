import { prisma } from '../../config/db.js';
import { AIProviderService } from '../ai/aiProvider.service.js';

export interface SectionPlan {
  sectionName: string;
  sectionTitle: string;
  questionType: string;
  numberOfQuestions: number;
  marksPerQuestion: number;
  totalSectionMarks: number;
  instructions?: string;
  hasInternalChoice?: boolean;
  choiceNote?: string;
}

export interface DifficultyDistribution {
  mode: 'BASIC' | 'MEDIUM' | 'HARD' | 'MIXED';
  basicPercentage: number;
  mediumPercentage: number;
  hardPercentage: number;
}

export interface GeneratedQuestionItem {
  sectionName: string;
  questionNumber: number;
  questionText: string;
  questionType: string;
  marks: number;
  difficulty: 'BASIC' | 'MEDIUM' | 'HARD';
  unitTag: string;
  topicTag: string;
  options?: string[]; // for MCQs
  bloomLevel: string;
  syllabusRef: string;
}

export class QuestionGeneratorService {
  /**
   * Validate examination pattern mathematically before generation.
   */
  public static validatePattern(
    totalMarks: number,
    sections: SectionPlan[],
    difficulty: DifficultyDistribution
  ): { valid: boolean; calculatedTotal: number; errors: string[] } {
    const errors: string[] = [];
    let calculatedTotal = 0;

    if (!sections || sections.length === 0) {
      errors.push('At least one examination section must be configured.');
    }

    sections.forEach((sec, idx) => {
      if (sec.numberOfQuestions <= 0) {
        errors.push(`${sec.sectionName || `Section ${idx + 1}`}: Question count must be greater than zero.`);
      }
      if (sec.marksPerQuestion <= 0) {
        errors.push(`${sec.sectionName || `Section ${idx + 1}`}: Marks per question must be greater than zero.`);
      }
      calculatedTotal += sec.numberOfQuestions * sec.marksPerQuestion;
    });

    if (calculatedTotal !== totalMarks) {
      errors.push(
        `Pattern mark mismatch: The sum of sections (${calculatedTotal} marks) does not match total examination marks (${totalMarks} marks).`
      );
    }

    if (difficulty.mode === 'MIXED') {
      const sumDiff = difficulty.basicPercentage + difficulty.mediumPercentage + difficulty.hardPercentage;
      if (sumDiff !== 100) {
        errors.push(
          `Difficulty percentages must total 100% (Current sum: ${sumDiff}% -> Basic: ${difficulty.basicPercentage}%, Medium: ${difficulty.mediumPercentage}%, Hard: ${difficulty.hardPercentage}%).`
        );
      }
    }

    return {
      valid: errors.length === 0,
      calculatedTotal,
      errors,
    };
  }

  /**
   * Generate questions using Gemini AI according to syllabus, sections, and difficulty.
   */
  public static async generatePaperQuestions(paperId: string): Promise<GeneratedQuestionItem[]> {
    const paper = await prisma.questionPaper.findUnique({
      where: { id: paperId },
      include: {
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
      throw new Error('Question paper not found.');
    }

    const sections: SectionPlan[] = JSON.parse(paper.patternConfigJson);
    const difficulty: DifficultyDistribution = JSON.parse(paper.difficultyDistribution);

    // Prepare syllabus context
    let syllabusSummary = '';
    if (paper.syllabusDoc?.units && paper.syllabusDoc.units.length > 0) {
      syllabusSummary = paper.syllabusDoc.units
        .map(
          (u) =>
            `Unit ${u.unitNumber}: ${u.title}\n` +
            `Topics: ` +
            u.topics.map((t) => `${t.topicName} (Key concepts: ${t.keyConceptsJson || ''})`).join('; ')
        )
        .join('\n\n');
    } else if (paper.syllabusDoc?.extractedRawText) {
      syllabusSummary = paper.syllabusDoc.extractedRawText.slice(0, 10000);
    } else {
      syllabusSummary = `Subject: ${paper.subjectName}, Standard: ${paper.standardOrSemester}`;
    }

    let generatedItems: GeneratedQuestionItem[];
    try {
      generatedItems = await this.performAIQuestionGeneration(paper, sections, difficulty, syllabusSummary);
    } catch (err: any) {
      console.warn('AI Question generation fallback activated:', err.message);
      generatedItems = this.performFallbackQuestionGeneration(paper, sections, difficulty);
    }

    // Persist questions in database
    await prisma.question.deleteMany({ where: { paperId } });

    let order = 1;
    for (const q of generatedItems) {
      await prisma.question.create({
        data: {
          paperId,
          sectionName: q.sectionName,
          questionNumber: q.questionNumber,
          questionText: q.questionText,
          questionType: q.questionType,
          marks: q.marks,
          difficulty: q.difficulty,
          unitTag: q.unitTag,
          topicTag: q.topicTag,
          optionsJson: q.options ? JSON.stringify(q.options) : null,
          bloomLevel: q.bloomLevel,
          syllabusRef: q.syllabusRef,
          orderIndex: order++,
        },
      });
    }

    await prisma.questionPaper.update({
      where: { id: paperId },
      data: { status: 'GENERATED' },
    });

    return generatedItems;
  }

  private static async performAIQuestionGeneration(
    paper: any,
    sections: SectionPlan[],
    difficulty: DifficultyDistribution,
    syllabusContext: string
  ): Promise<GeneratedQuestionItem[]> {
    const prompt = `
Generate a complete, professional examination question paper strictly conforming to the following parameters:

EXAMINATION METADATA:
- Institution: ${paper.institutionName}
- Exam Name: ${paper.examName}
- Subject: ${paper.subjectName}
- Board: ${paper.boardName}
- Grade/Semester: ${paper.standardOrSemester}
- Total Marks: ${paper.totalMarks}
- Difficulty Setting: Mode=${difficulty.mode} (Basic=${difficulty.basicPercentage}%, Medium=${difficulty.mediumPercentage}%, Hard=${difficulty.hardPercentage}%)

SECTIONS BLUEPRINT & QUESTIONS REQUIRED:
${sections
  .map(
    (s, idx) =>
      `Section ${s.sectionName} ("${s.sectionTitle}"):
       - Question Type: ${s.questionType}
       - Number of questions: ${s.numberOfQuestions}
       - Marks per question: ${s.marksPerQuestion} marks
       - Section Total: ${s.numberOfQuestions * s.marksPerQuestion} marks
       - Internal choice: ${s.choiceNote || 'All questions compulsory'}`
  )
  .join('\n\n')}

VERIFIED SYLLABUS CURRICULUM:
"""
${syllabusContext}
"""

STRICT ACADEMIC RULES:
1. Every single question MUST be directly grounded in the provided syllabus. Do NOT invent concepts outside the curriculum.
2. For MCQs: provide 4 distinct, unambiguous options formatted as ["A) ...", "B) ...", "C) ...", "D) ..."].
3. Ensure proportional syllabus coverage across all units.
4. Maintain exact difficulty allocation as requested.
5. Questions must be academically rigorous, grammatically sound, and age/grade appropriate.
6. Number questions sequentially (1, 2, 3...) across sections.

OUTPUT FORMAT: Strict valid JSON conforming to:
{
  "questions": [
    {
      "sectionName": "Section A",
      "questionNumber": 1,
      "questionText": "...",
      "questionType": "MCQ",
      "marks": 1,
      "difficulty": "BASIC",
      "unitTag": "Unit 1: ...",
      "topicTag": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "bloomLevel": "REMEMBER",
      "syllabusRef": "Concept citation from Unit 1"
    }
  ]
}
`;

    const res = await AIProviderService.generateStructuredJson<{ questions: GeneratedQuestionItem[] }>(prompt);
    return res.questions;
  }

  /**
   * Deterministic fallback questions if AI key is missing or rate limited.
   */
  private static performFallbackQuestionGeneration(
    paper: any,
    sections: SectionPlan[],
    difficulty: DifficultyDistribution
  ): GeneratedQuestionItem[] {
    const questions: GeneratedQuestionItem[] = [];
    let qNum = 1;

    const units = paper.syllabusDoc?.units || [];

    sections.forEach((sec) => {
      for (let i = 0; i < sec.numberOfQuestions; i++) {
        const unit = units.length > 0 ? units[i % units.length] : null;
        const topic = unit?.topics?.length > 0 ? unit.topics[i % unit.topics.length] : null;

        const diff: 'BASIC' | 'MEDIUM' | 'HARD' =
          difficulty.mode === 'BASIC'
            ? 'BASIC'
            : difficulty.mode === 'HARD'
            ? 'HARD'
            : i % 3 === 0
            ? 'BASIC'
            : i % 3 === 1
            ? 'MEDIUM'
            : 'HARD';

        let qText = '';
        let options: string[] | undefined = undefined;

        if (sec.questionType === 'MCQ') {
          qText = `Which of the following statements is correct regarding ${topic?.topicName || paper.subjectName}?`;
          options = [
            `A) It fundamental property governs the primary characteristics of ${topic?.topicName || 'the system'}.`,
            `B) It decreases linearly with temperature in isolated conditions.`,
            `C) It is entirely independent of initial thermodynamic boundary states.`,
            `D) It operates as a constant without reference to external variations.`
          ];
        } else if (sec.questionType === 'SHORT_ANSWER') {
          qText = `Define ${topic?.topicName || 'the core principle'} and state two significant practical applications in ${paper.subjectName}.`;
        } else if (sec.questionType === 'LONG_ANSWER' || sec.questionType === 'ESSAY') {
          qText = `Explain the working principle and theoretical formulation of ${topic?.topicName || 'the primary mechanism'} in detail with relevant diagrams and mathematical derivations where applicable.`;
        } else if (sec.questionType === 'NUMERICAL') {
          qText = `A system operating under standard conditions experiences a parameter change related to ${topic?.topicName || 'the state variable'}. Calculate the resultant output and determine the efficiency index.`;
        } else {
          qText = `Analyze the significance of ${topic?.topicName || 'this concept'} within the framework of ${unit?.title || paper.subjectName}.`;
        }

        questions.push({
          sectionName: sec.sectionName,
          questionNumber: qNum++,
          questionText: qText,
          questionType: sec.questionType,
          marks: sec.marksPerQuestion,
          difficulty: diff,
          unitTag: unit?.title || 'Unit 1',
          topicTag: topic?.topicName || paper.subjectName,
          options,
          bloomLevel: sec.marksPerQuestion >= 5 ? 'ANALYZE' : sec.marksPerQuestion >= 2 ? 'UNDERSTAND' : 'REMEMBER',
          syllabusRef: `Syllabus reference for ${topic?.topicName || paper.subjectName}`,
        });
      }
    });

    return questions;
  }

  /**
   * Regenerate a single question without altering other questions in the paper.
   */
  public static async regenerateSingleQuestion(paperId: string, questionId: string): Promise<any> {
    const question = await prisma.question.findFirst({
      where: { id: questionId, paperId },
      include: {
        paper: {
          include: {
            syllabusDoc: true,
          },
        },
      },
    });

    if (!question) {
      throw new Error('Question not found in this paper.');
    }

    const prompt = `
Generate a fresh, alternate examination question to replace the following question:
Subject: ${question.paper.subjectName}
Grade/Level: ${question.paper.standardOrSemester}
Question Type: ${question.questionType}
Marks: ${question.marks}
Difficulty: ${question.difficulty}
Unit / Topic: ${question.unitTag} - ${question.topicTag}

PREVIOUS QUESTION TO REPLACE (DO NOT DUPLICATE THIS):
"${question.questionText}"

REQUIREMENTS:
- Produce a distinct, high-quality alternate question testing the same topic at the exact same mark and difficulty level.
- If MCQ, provide 4 options ["A) ...", "B) ...", "C) ...", "D) ..."].

OUTPUT FORMAT: Strict valid JSON:
{
  "questionText": "...",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "bloomLevel": "${question.bloomLevel || 'UNDERSTAND'}",
  "syllabusRef": "${question.syllabusRef || 'Syllabus reference'}"
}
`;

    let newQ: any;
    try {
      newQ = await AIProviderService.generateStructuredJson<any>(prompt);
    } catch {
      newQ = {
        questionText: `Alternate Question: Describe in detail the essential mechanisms of ${question.topicTag || question.unitTag} with respect to ${question.paper.subjectName}.`,
        options: question.questionType === 'MCQ' ? [
          'A) First alternate possibility',
          'B) Second alternate possibility',
          'C) Third alternate possibility',
          'D) Fourth alternate possibility'
        ] : undefined,
        bloomLevel: question.bloomLevel,
        syllabusRef: question.syllabusRef,
      };
    }

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        questionText: newQ.questionText,
        optionsJson: newQ.options ? JSON.stringify(newQ.options) : null,
        bloomLevel: newQ.bloomLevel,
        syllabusRef: newQ.syllabusRef,
      },
    });

    return updated;
  }
}

