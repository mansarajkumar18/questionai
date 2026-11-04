import { prisma } from '../../config/db.js';
import { AIProviderService } from '../ai/aiProvider.service.js';

export interface StructuredTopic {
  topicName: string;
  subtopics: string[];
  keyConcepts: string[];
  bloomLevels: string[];
  importanceScore: number;
}

export interface StructuredUnit {
  unitNumber: number;
  title: string;
  description: string;
  weightagePercent: number;
  topics: StructuredTopic[];
}

export interface SyllabusAnalysisResult {
  units: StructuredUnit[];
  summary: string;
  totalUnitsCount: number;
  learningObjectives?: string[];
}

export class SyllabusAnalyzerService {
  /**
   * Analyze raw syllabus text and extract structured units, topics, and Bloom's learning levels.
   */
  public static async analyzeSyllabus(
    syllabusDocId: string,
    metadata?: {
      subjectName?: string;
      boardName?: string;
      standardOrSemester?: string;
      instructions?: string;
    }
  ): Promise<SyllabusAnalysisResult> {
    const doc = await prisma.syllabusDocument.findUnique({
      where: { id: syllabusDocId },
    });

    if (!doc) {
      throw new Error('Syllabus document not found.');
    }

    const rawText = doc.extractedRawText.trim();
    if (rawText.length < 20) {
      throw new Error('Syllabus text is too brief to analyze. Please provide more detailed syllabus content.');
    }

    // Try AI generation first
    let analysisResult: SyllabusAnalysisResult;
    try {
      analysisResult = await this.performAIAnalysis(rawText, metadata);
    } catch (aiErr: any) {
      console.warn('AI analysis fell back to deterministic structural parser:', aiErr.message);
      analysisResult = this.performDeterministicParsing(rawText, metadata?.subjectName || doc.title);
    }

    // Persist extracted units and topics in the database
    // Remove any previously generated units for this doc
    await prisma.syllabusUnit.deleteMany({
      where: { syllabusDocumentId: syllabusDocId },
    });

    for (const unit of analysisResult.units) {
      const createdUnit = await prisma.syllabusUnit.create({
        data: {
          syllabusDocumentId: syllabusDocId,
          unitNumber: unit.unitNumber,
          title: unit.title,
          description: unit.description,
          weightagePercent: unit.weightagePercent || 0,
        },
      });

      for (const topic of unit.topics) {
        await prisma.syllabusTopic.create({
          data: {
            unitId: createdUnit.id,
            topicName: topic.topicName,
            subtopicsJson: JSON.stringify(topic.subtopics || []),
            keyConceptsJson: JSON.stringify(topic.keyConcepts || []),
            bloomLevelsJson: JSON.stringify(topic.bloomLevels || ['UNDERSTAND', 'APPLY']),
            importanceScore: topic.importanceScore || 3,
          },
        });
      }
    }

    // Update document status
    await prisma.syllabusDocument.update({
      where: { id: syllabusDocId },
      data: { status: 'ANALYZED' },
    });

    return analysisResult;
  }

  private static async performAIAnalysis(
    rawText: string,
    metadata?: any
  ): Promise<SyllabusAnalysisResult> {
    const prompt = `
Analyze the following curriculum/syllabus text and extract a structured academic breakdown.
Subject: ${metadata?.subjectName || 'General'}
Board / Level: ${metadata?.boardName || 'Standard'}
Grade / Semester: ${metadata?.standardOrSemester || 'General'}
Additional Guidelines: ${metadata?.instructions || 'Ensure comprehensive coverage of all units'}

SYLLABUS CONTENT:
"""
${rawText.slice(0, 25000)}
"""

REQUIREMENTS:
1. Divide into clear Units / Chapters / Modules.
2. For each unit, specify unitNumber, clean descriptive title, brief description, and estimated exam weightage percentage (must sum to ~100%).
3. For each unit, break down 2-5 distinct topics.
4. For each topic, provide:
   - topicName (string)
   - subtopics (array of strings)
   - keyConcepts (array of crucial definitions, equations, or laws)
   - bloomLevels (array from: ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"])
   - importanceScore (1 to 5 integer)
5. Provide a summary of the overall syllabus scope and 3-5 learning objectives.

OUTPUT FORMAT: Return STRICT valid JSON conforming to this structure:
{
  "units": [
    {
      "unitNumber": 1,
      "title": "Unit 1: ...",
      "description": "...",
      "weightagePercent": 20,
      "topics": [
        {
          "topicName": "...",
          "subtopics": ["...", "..."],
          "keyConcepts": ["...", "..."],
          "bloomLevels": ["UNDERSTAND", "APPLY"],
          "importanceScore": 4
        }
      ]
    }
  ],
  "summary": "...",
  "totalUnitsCount": 5,
  "learningObjectives": ["...", "..."]
}
`;

    return await AIProviderService.generateStructuredJson<SyllabusAnalysisResult>(prompt);
  }

  /**
   * Deterministic regex-based fallback parser if AI key is not yet configured.
   * Accurately parses Unit / Chapter / Module headings and bulleted topic lists.
   */
  private static performDeterministicParsing(
    rawText: string,
    subjectTitle: string
  ): SyllabusAnalysisResult {
    const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const units: StructuredUnit[] = [];

    let currentUnit: StructuredUnit | null = null;
    let currentTopics: StructuredTopic[] = [];

    const unitRegex = /^(unit|chapter|module|part|lesson)\s*([0-9ivxlc]+)[:\.\-\s]*(.*)/i;

    for (const line of lines) {
      const match = line.match(unitRegex);
      if (match) {
        if (currentUnit) {
          currentUnit.topics = currentTopics.length > 0 ? currentTopics : [
            {
              topicName: `${currentUnit.title} Overview`,
              subtopics: ['Core Principles', 'Practical Applications'],
              keyConcepts: ['Key Definitions', 'Formulas'],
              bloomLevels: ['UNDERSTAND', 'APPLY'],
              importanceScore: 4,
            },
          ];
          units.push(currentUnit);
          currentTopics = [];
        }

        const unitNum = units.length + 1;
        const titleStr = match[3] ? match[3].trim() : `Unit ${unitNum}`;
        currentUnit = {
          unitNumber: unitNum,
          title: `Unit ${unitNum}: ${titleStr || 'Core Concepts'}`,
          description: `Detailed syllabus coverage for ${titleStr}`,
          weightagePercent: 20,
          topics: [],
        };
      } else if (line.length > 4 && currentUnit) {
        // Collect as topic or subtopic
        if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*') || /^\d+\./.test(line)) {
          const cleanTopic = line.replace(/^[\-•\*\d\.]+\s*/, '').trim();
          if (cleanTopic.length > 3) {
            currentTopics.push({
              topicName: cleanTopic,
              subtopics: ['Fundamental Concepts', 'Analytical Applications'],
              keyConcepts: [cleanTopic],
              bloomLevels: ['UNDERSTAND', 'APPLY'],
              importanceScore: 3,
            });
          }
        }
      }
    }

    if (currentUnit) {
      currentUnit.topics = currentTopics.length > 0 ? currentTopics : [
        {
          topicName: `${currentUnit.title} Topics`,
          subtopics: ['Concepts', 'Examples'],
          keyConcepts: ['Key Concepts'],
          bloomLevels: ['UNDERSTAND', 'APPLY'],
          importanceScore: 3,
        },
      ];
      units.push(currentUnit);
    }

    // If no explicit "Unit" keywords found, group lines into 3 logical units
    if (units.length === 0) {
      const chunkSize = Math.max(3, Math.ceil(lines.length / 3));
      for (let i = 0; i < 3 && i * chunkSize < lines.length; i++) {
        const chunk = lines.slice(i * chunkSize, (i + 1) * chunkSize);
        const unitTitle = chunk[0]?.slice(0, 50) || `Module ${i + 1}`;
        units.push({
          unitNumber: i + 1,
          title: `Unit ${i + 1}: ${unitTitle}`,
          description: `Key syllabus section covering ${unitTitle}`,
          weightagePercent: i === 0 ? 35 : i === 1 ? 35 : 30,
          topics: chunk.slice(1, 5).map((t, idx) => ({
            topicName: t.replace(/^[\-•\*\d\.]+\s*/, '').slice(0, 60),
            subtopics: ['Sub-concept A', 'Sub-concept B'],
            keyConcepts: ['Definitions', 'Theory'],
            bloomLevels: ['REMEMBER', 'UNDERSTAND', 'APPLY'],
            importanceScore: 3,
          })),
        });
      }
    }

    // Normalize weightages
    const count = units.length || 1;
    units.forEach((u) => {
      u.weightagePercent = Math.round(100 / count);
    });

    return {
      units,
      summary: `Structured syllabus representation extracted for ${subjectTitle} comprising ${units.length} academic units.`,
      totalUnitsCount: units.length,
      learningObjectives: [
        'Understand foundational principles across all syllabus units',
        'Demonstrate analytical problem-solving and conceptual clarity',
        'Apply domain methodologies to real-world questions',
      ],
    };
  }
}

