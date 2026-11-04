export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TEACHER';
  institutionId?: string;
  institution?: Institution;
}

export interface Institution {
  id: string;
  name: string;
  logoUrl?: string;
  address?: string;
  contactEmail?: string;
  examHeaderConfig?: string;
}

export interface Board {
  id: string;
  name: string;
  code: string;
  category: 'SCHOOL' | 'COLLEGE' | 'COMPETITIVE';
  description?: string;
  defaultPatternsJson?: string;
}

export interface SyllabusUnit {
  id: string;
  unitNumber: number;
  title: string;
  description?: string;
  weightagePercent?: number;
  topics: SyllabusTopic[];
}

export interface SyllabusTopic {
  id: string;
  topicName: string;
  subtopicsJson?: string;
  keyConceptsJson?: string;
  bloomLevelsJson?: string;
  importanceScore?: number;
}

export interface SyllabusDocument {
  id: string;
  title: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  extractedRawText: string;
  ocrConfidence?: number;
  status: 'PENDING' | 'EXTRACTED' | 'ANALYZED' | 'FAILED';
  units?: SyllabusUnit[];
  createdAt: string;
}

export interface ExamSectionConfig {
  id: string;
  sectionName: string; // e.g. "Section A"
  sectionTitle: string; // e.g. "Multiple Choice Questions"
  instructions?: string;
  questionType: 'MCQ' | 'FILL_BLANK' | 'TRUE_FALSE' | 'MATCH' | 'SHORT_ANSWER' | 'LONG_ANSWER' | 'ESSAY' | 'NUMERICAL' | 'APPLICATION';
  numberOfQuestions: number;
  marksPerQuestion: number;
  totalSectionMarks: number;
  hasInternalChoice?: boolean;
  choiceNote?: string; // e.g. "Answer any 5 out of 7"
}

export interface DifficultyConfig {
  mode: 'BASIC' | 'MEDIUM' | 'HARD' | 'MIXED';
  basicPercentage: number;
  mediumPercentage: number;
  hardPercentage: number;
}

export interface Question {
  id: string;
  paperId: string;
  sectionName: string;
  questionNumber: number;
  questionText: string;
  questionType: string;
  marks: number;
  difficulty: 'BASIC' | 'MEDIUM' | 'HARD';
  unitTag?: string;
  topicTag?: string;
  optionsJson?: string; // stringified array
  bloomLevel?: string;
  syllabusRef?: string;
  orderIndex: number;
  answer?: AnswerKeyItem;
}

export interface AnswerKeyItem {
  id: string;
  answerKeyId: string;
  questionId: string;
  solutionText: string;
  stepByStepMarksJson?: string;
  rationaleExplanation?: string;
  keyPointsJson?: string;
  alternativeAcceptableAnswers?: string;
}

export interface QuestionPaper {
  id: string;
  title: string;
  institutionName: string;
  institutionLogo?: string;
  examName: string;
  subjectName: string;
  boardName: string;
  standardOrSemester: string;
  academicYear: string;
  examDate?: string;
  durationMinutes: number;
  totalMarks: number;
  difficultyDistribution: string;
  patternConfigJson: string;
  instructionsText?: string;
  status: 'DRAFT' | 'GENERATED' | 'AUDITED' | 'FINALIZED';
  questions: Question[];
  answerKey?: {
    id: string;
    items: AnswerKeyItem[];
  };
  auditReport?: {
    overallScore: number;
    syllabusAdherenceScore: number;
    markSanityPassed: boolean;
    difficultyBalanceScore: number;
    feedbackJson: string;
    flaggedQuestionsJson?: string;
  };
  createdAt: string;
  updatedAt: string;
}
