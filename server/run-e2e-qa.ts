// Complete End-to-End QA Test Suite for Q-GEN AI
// Validates:
// 1. Board categories & dropdown data from backend
// 2. Syllabus upload (PDF, OCR, text extraction)
// 3. Question paper blueprint creation & total marks configuration
// 4. Google Gemini AI Question Generation
// 5. Google Gemini AI Answer Key Generation
// 6. Dual Academic PDF Generation (Question Paper & Answer Key)
// 7. 10-Point Quality and Accuracy Audit

async function runEndToEndTest() {
  const base = 'http://localhost:5000/api/v1';
  console.log('========================================================================');
  console.log('       Q-GEN AI - COMPLETE END-TO-END QA TEST SUITE');
  console.log('========================================================================\n');

  const report: Record<string, any> = {};

  // ---------------------------------------------------------
  // STEP 1: SUBJECT DETAILS & BOARDS DROPDOWN
  // ---------------------------------------------------------
  console.log('--- [STEP 1: SUBJECT DETAILS & BOARDS DROPDOWN] ---');
  try {
    const boardsRes = await fetch(base + '/boards');
    const boardsData: any = await boardsRes.json();
    console.log('Board Dropdown API Status:', boardsRes.status, 'Total Boards:', boardsData.count);
    const cbse = boardsData.boards?.find((b: any) => b.code === 'CBSE');
    const icse = boardsData.boards?.find((b: any) => b.code === 'ICSE');
    const state = boardsData.boards?.find((b: any) => b.code === 'STATE_BOARD');
    const engg = boardsData.boards?.find((b: any) => b.code === 'ENGG_SEM');

    console.log(' - CBSE Available:', !!cbse, cbse ? cbse.name : 'N/A');
    console.log(' - ICSE Available:', !!icse, icse ? icse.name : 'N/A');
    console.log(' - State Board Available:', !!state, state ? state.name : 'N/A');
    console.log(' - Engineering College Available:', !!engg, engg ? engg.name : 'N/A');

    report.boards = { pass: boardsRes.status === 200 && boardsData.count >= 11, count: boardsData.count };
  } catch (err: any) {
    console.error('Boards failed:', err);
    report.boards = { pass: false, error: err.message };
  }

  // ---------------------------------------------------------
  // STEP 2: SYLLABUS UPLOAD & EXTRACTION (OCR / Text)
  // ---------------------------------------------------------
  console.log('\n--- [STEP 2: SYLLABUS UPLOAD & EXTRACTION] ---');
  let syllabusDocId: string | null = null;
  try {
    const form = new FormData();
    const syllabusContent = `
SUBJECT: Computer Science & Artificial Intelligence
GRADE: Higher Secondary (+2) / Grade 12

UNIT 1: Computational Thinking and Algorithms
- Big-O Notation and Time Complexity Analysis
- Sorting Algorithms: Bubble Sort, Quick Sort, Merge Sort
- Searching Algorithms: Linear and Binary Search

UNIT 2: Relational Databases and SQL
- Relational Data Model, Primary and Foreign Keys
- SQL DDL: CREATE TABLE, ALTER, DROP
- SQL DML: SELECT, WHERE, GROUP BY, HAVING, ORDER BY
- Joins: INNER JOIN, LEFT JOIN, RIGHT JOIN

UNIT 3: Fundamentals of Artificial Intelligence
- Concepts of Machine Learning: Supervised vs Unsupervised Learning
- Neural Networks: Perceptron, Activation Functions (Sigmoid, ReLU)
- Natural Language Processing (NLP) and Large Language Models (LLMs)
- Ethics and Bias in Artificial Intelligence systems
`;
    const blob = new Blob([syllabusContent], { type: 'text/plain' });
    form.append('files', blob, 'cs_ai_syllabus_grade12.txt');
    form.append('title', 'Computer Science & AI Grade 12 Syllabus');

    const uploadRes = await fetch(base + '/syllabus/upload', { method: 'POST', body: form });
    const uploadData: any = await uploadRes.json();
    console.log('Syllabus Upload Status:', uploadRes.status, 'Doc ID:', uploadData.document?.id);
    console.log('OCR Confidence:', uploadData.document?.ocrConfidence + '%', 'Extracted Length:', uploadData.document?.extractedRawText?.length, 'chars');
    syllabusDocId = uploadData.document?.id;
    report.syllabus = { pass: uploadRes.status === 201 && !!syllabusDocId, docId: syllabusDocId };
  } catch (err: any) {
    console.error('Syllabus upload failed:', err);
    report.syllabus = { pass: false, error: err.message };
  }

  // ---------------------------------------------------------
  // STEP 3: QUESTION PAPER CONFIGURATION (BLUEPRINT VALIDATION)
  // ---------------------------------------------------------
  console.log('\n--- [STEP 3: BLUEPRINT CONFIGURATION & MATH SANITY] ---');
  let paperId: string | null = null;
  try {
    const paperPayload = {
      title: 'Computer Science & AI Model Examination 2026',
      institutionName: 'Apex Institute of Science & Technology',
      examName: 'Annual Board Model Assessment 2026',
      subjectName: 'Computer Science & Artificial Intelligence',
      boardName: 'CBSE (Central Board of Secondary Education)',
      standardOrSemester: 'Grade 12 (Higher Secondary)',
      academicYear: '2026-2027',
      durationMinutes: 180,
      totalMarks: 35,
      difficultyDistribution: { mode: 'BALANCED', basicPercentage: 40, mediumPercentage: 40, hardPercentage: 20 },
      patternConfig: [
        { sectionName: 'Section A', sectionTitle: 'Objective MCQs (Recall & Concepts)', questionType: 'MCQ', numberOfQuestions: 5, marksPerQuestion: 1, totalSectionMarks: 5 },
        { sectionName: 'Section B', sectionTitle: 'Short Conceptual Questions', questionType: 'SHORT_ANSWER', numberOfQuestions: 5, marksPerQuestion: 2, totalSectionMarks: 10 },
        { sectionName: 'Section C', sectionTitle: 'Analytical & Programming Questions', questionType: 'LONG_ANSWER', numberOfQuestions: 4, marksPerQuestion: 5, totalSectionMarks: 20 }
      ],
      instructionsText: '1. All questions are compulsory. 2. Use of calculators is strictly prohibited.',
      syllabusDocId: syllabusDocId
    };

    const paperRes = await fetch(base + '/papers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paperPayload)
    });
    const paperData: any = await paperRes.json();
    console.log('Paper Blueprint Creation Status:', paperRes.status, 'Paper ID:', paperData.paper?.id);
    console.log('Total Marks Configured:', paperData.paper?.totalMarks, 'Status:', paperData.paper?.status);
    paperId = paperData.paper?.id;
    report.configuration = { pass: paperRes.status === 201 && !!paperId, paperId };
  } catch (err: any) {
    console.error('Configuration failed:', err);
    report.configuration = { pass: false, error: err.message };
  }

  // ---------------------------------------------------------
  // STEP 4: AI QUESTION GENERATION ENGINE
  // ---------------------------------------------------------
  console.log('\n--- [STEP 4: AI QUESTION GENERATION ENGINE] ---');
  try {
    console.log('Calling Gemini AI Question Generator for Paper ID:', paperId, '...');
    const t0 = Date.now();
    const genRes = await fetch(base + '/papers/' + paperId + '/generate', { method: 'POST' });
    const genData: any = await genRes.json();
    const durationSec = ((Date.now() - t0) / 1000).toFixed(1);
    console.log('AI Question Generation Status:', genRes.status, 'in', durationSec, 'seconds');
    console.log('Total Questions Generated:', genData.questions?.length);
    if (genData.questions && genData.questions.length > 0) {
      console.log('Sample Q1:', genData.questions[0].questionText);
      console.log('Q1 Type & Marks:', genData.questions[0].questionType, '-', genData.questions[0].marks, 'mark(s)');
      console.log('Q1 Bloom Taxonomy:', genData.questions[0].bloomLevel);
      console.log('Q1 Syllabus Reference:', genData.questions[0].syllabusRef);
    }
    report.aiGeneration = { pass: genRes.status === 200 && genData.questions?.length === 14, count: genData.questions?.length, durationSec };
  } catch (err: any) {
    console.error('AI Generation failed:', err);
    report.aiGeneration = { pass: false, error: err.message };
  }

  // ---------------------------------------------------------
  // STEP 5: AI ANSWER KEY GENERATION
  // ---------------------------------------------------------
  console.log('\n--- [STEP 5: AI ANSWER KEY GENERATION] ---');
  try {
    console.log('Calling Answer Key Generator for Paper ID:', paperId, '...');
    const t0 = Date.now();
    const ansRes = await fetch(base + '/papers/' + paperId + '/answer-key/generate', { method: 'POST' });
    const ansData: any = await ansRes.json();
    const durationSec = ((Date.now() - t0) / 1000).toFixed(1);
    const count = ansData.answerKey?.items?.length || ansData.itemsCount || 0;
    console.log('Answer Key Status:', ansRes.status, 'in', durationSec, 'seconds');
    console.log('Answer Items Count:', count);
    if (ansData.answerKey?.items?.[0]) {
      console.log('Sample Answer 1:', ansData.answerKey.items[0].modelAnswer);
      console.log('Marking Breakdown:', ansData.answerKey.items[0].markingBreakdown);
    }
    report.answerKey = { pass: ansRes.status === 200 && count > 0, itemsCount: count, durationSec };
  } catch (err: any) {
    console.error('Answer Key failed:', err);
    report.answerKey = { pass: false, error: err.message };
  }

  // ---------------------------------------------------------
  // STEP 6: DUAL ACADEMIC PDF GENERATION & DOWNLOAD
  // ---------------------------------------------------------
  console.log('\n--- [STEP 6: DUAL ACADEMIC PDF GENERATION] ---');
  try {
    // 6A. Question Paper PDF
    const pdfRes = await fetch(base + '/papers/' + paperId + '/pdf');
    const pdfBuffer = await pdfRes.arrayBuffer();
    console.log('Question Paper PDF Status:', pdfRes.status, 'ContentType:', pdfRes.headers.get('content-type'), 'Size:', pdfBuffer.byteLength, 'bytes');

    // 6B. Answer Key PDF
    const ansPdfRes = await fetch(base + '/papers/' + paperId + '/pdf/answers');
    const ansPdfBuffer = await ansPdfRes.arrayBuffer();
    console.log('Answer Key PDF Status:', ansPdfRes.status, 'ContentType:', ansPdfRes.headers.get('content-type'), 'Size:', ansPdfBuffer.byteLength, 'bytes');

    const pdfPass = pdfRes.status === 200 && pdfBuffer.byteLength > 1000 && ansPdfRes.status === 200 && ansPdfBuffer.byteLength > 1000;
    report.pdf = { pass: pdfPass, paperBytes: pdfBuffer.byteLength, answersBytes: ansPdfBuffer.byteLength };
  } catch (err: any) {
    console.error('PDF failed:', err);
    report.pdf = { pass: false, error: err.message };
  }

  // ---------------------------------------------------------
  // STEP 7: 10-POINT QUALITY AUDIT
  // ---------------------------------------------------------
  console.log('\n--- [STEP 7: 10-POINT QUALITY AUDIT CHECKLIST] ---');
  try {
    const auditRes = await fetch(base + '/papers/' + paperId + '/audit', { method: 'POST' });
    const auditData: any = await auditRes.json();
    console.log('Audit Status:', auditRes.status, 'Score:', auditData.report?.overallScore + '/100');
    console.log('Syllabus Adherence:', auditData.report?.syllabusAdherenceScore + '/100');
    console.log('Math Sanity Passed:', auditData.report?.markSanityPassed);
    report.audit = { pass: auditRes.status === 200, score: auditData.report?.overallScore, details: auditData.report };
  } catch (err: any) {
    console.error('Audit failed:', err);
    report.audit = { pass: false, error: err.message };
  }

  console.log('\n========================================================================');
  console.log('FINAL E2E EXECUTION SUMMARY:');
  console.log(JSON.stringify(report, null, 2));
  console.log('========================================================================\n');
}

runEndToEndTest().catch(console.error);