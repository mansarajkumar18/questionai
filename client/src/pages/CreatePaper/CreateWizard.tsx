import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Upload,
  BookOpen,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Clock,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { ExamSectionConfig, DifficultyConfig, Board, SyllabusDocument, SyllabusUnit } from '../../types';

export const CreateWizard: React.FC = () => {
  const navigate = useNavigate();

  // Wizard Step: 1 = Input & Syllabus, 2 = AI Syllabus Analysis, 3 = Exam Pattern & Math, 4 = Generating
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Input & Syllabus State
  const [subjectName, setSubjectName] = useState('');
  const [boardId, setBoardId] = useState('');
  const [selectedBoardName, setSelectedBoardName] = useState('');
  const [standardOrSemester, setStandardOrSemester] = useState('');
  const [medium, setMedium] = useState('English');
  const [instructions, setInstructions] = useState('');
  const [boards, setBoards] = useState<Board[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [extractedDoc, setExtractedDoc] = useState<SyllabusDocument | null>(null);
  const [editableRawText, setEditableRawText] = useState('');
  const [savedTextSuccess, setSavedTextSuccess] = useState(false);

  // Step 2: AI Syllabus Analysis State
  const [analyzingSyllabus, setAnalyzingSyllabus] = useState(false);
  const [structuredUnits, setStructuredUnits] = useState<SyllabusUnit[]>([]);
  const [syllabusSummary, setSyllabusSummary] = useState('');

  // Step 3: Exam Pattern & Blueprint State
  const [institutionName, setInstitutionName] = useState('Apex Academy of Science');
  const [examName, setExamName] = useState('Terminal Assessment Examination 2026');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [durationMinutes, setDurationMinutes] = useState<number>(180);
  const [totalMarks, setTotalMarks] = useState<number>(70);
  const [difficulty, setDifficulty] = useState<DifficultyConfig>({
    mode: 'MIXED',
    basicPercentage: 30,
    mediumPercentage: 40,
    hardPercentage: 30,
  });

  const [sections, setSections] = useState<ExamSectionConfig[]>([
    {
      id: '1',
      sectionName: 'Section A',
      sectionTitle: 'Multiple Choice Questions',
      questionType: 'MCQ',
      numberOfQuestions: 15,
      marksPerQuestion: 1,
      totalSectionMarks: 15,
      choiceNote: 'All questions are compulsory',
    },
    {
      id: '2',
      sectionName: 'Section B',
      sectionTitle: 'Short Answer Questions',
      questionType: 'SHORT_ANSWER',
      numberOfQuestions: 5,
      marksPerQuestion: 2,
      totalSectionMarks: 10,
      choiceNote: 'Answer in 2-3 sentences each',
    },
    {
      id: '3',
      sectionName: 'Section C',
      sectionTitle: 'Long Answer Questions',
      questionType: 'LONG_ANSWER',
      numberOfQuestions: 5,
      marksPerQuestion: 5,
      totalSectionMarks: 25,
      choiceNote: 'Detailed step-by-step answers required',
    },
    {
      id: '4',
      sectionName: 'Section D',
      sectionTitle: 'Essay / Comprehensive Problems',
      questionType: 'ESSAY',
      numberOfQuestions: 2,
      marksPerQuestion: 10,
      totalSectionMarks: 20,
      choiceNote: 'Structured essay with introduction and points',
    },
  ]);

  // Generation status
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');

  // Load Boards on mount
  useEffect(() => {
    api.get('/boards').then((res) => {
      if (res.data.success && res.data.boards.length > 0) {
        setBoards(res.data.boards);
        setBoardId(res.data.boards[0].id);
        setSelectedBoardName(res.data.boards[0].name);
      }
    });

    api.get('/auth/me').then((res) => {
      if (res.data.user?.institution?.name) {
        setInstitutionName(res.data.user.institution.name);
      }
    });
  }, []);

  // Recalculate section marks
  const updateSection = (index: number, updates: Partial<ExamSectionConfig>) => {
    const newSections = [...sections];
    const updated = { ...newSections[index], ...updates };
    updated.totalSectionMarks = updated.numberOfQuestions * updated.marksPerQuestion;
    newSections[index] = updated;
    setSections(newSections);
  };

  const addSection = () => {
    const nextChar = String.fromCharCode(65 + sections.length);
    const newSec: ExamSectionConfig = {
      id: Date.now().toString(),
      sectionName: `Section ${nextChar}`,
      sectionTitle: 'Short Answer Questions',
      questionType: 'SHORT_ANSWER',
      numberOfQuestions: 5,
      marksPerQuestion: 2,
      totalSectionMarks: 10,
    };
    setSections([...sections, newSec]);
  };

  const removeSection = (index: number) => {
    if (sections.length > 1) {
      setSections(sections.filter((_, i) => i !== index));
    }
  };

  const calculatedTotalMarks = sections.reduce((sum, s) => sum + s.numberOfQuestions * s.marksPerQuestion, 0);
  const marksMatch = calculatedTotalMarks === totalMarks;

  // Apply Pre-configured Template Blueprint
  const applyPresetBlueprint = (preset: any) => {
    setTotalMarks(preset.totalMarks);
    setDurationMinutes(preset.durationMinutes);
    const mapped = preset.sections.map((s: any, idx: number) => ({
      id: (idx + 1).toString(),
      sectionName: s.sectionName,
      sectionTitle: s.sectionTitle,
      questionType: s.questionType,
      numberOfQuestions: s.count,
      marksPerQuestion: s.marksPerQ,
      totalSectionMarks: s.count * s.marksPerQ,
    }));
    setSections(mapped);
  };

  // Step 1: Handle File Upload & OCR
  const handleUploadSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setUploadError('Please select at least one syllabus file (PDF, JPG, PNG, WEBP).');
      return;
    }

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    formData.append('subjectName', subjectName);
    formData.append('boardId', boardId);
    formData.append('standardOrSemester', standardOrSemester);
    formData.append('medium', medium);
    formData.append('instructions', instructions);

    try {
      const res = await api.post('/syllabus/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setExtractedDoc(res.data.document);
        setEditableRawText(res.data.document.extractedRawText);
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'File upload and extraction failed.');
    } finally {
      setUploading(false);
    }
  };

  // Save manual edits to extracted text
  const handleSaveEditedText = async () => {
    if (!extractedDoc) return;
    try {
      await api.put(`/syllabus/${extractedDoc.id}/text`, {
        extractedRawText: editableRawText,
      });
      setSavedTextSuccess(true);
      setTimeout(() => setSavedTextSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update syllabus text:', err);
    }
  };

  // Step 2: Trigger AI Syllabus Analysis Engine
  const handleAnalyzeSyllabus = async () => {
    if (!extractedDoc) return;
    setAnalyzingSyllabus(true);
    try {
      const res = await api.post(`/syllabus/${extractedDoc.id}/analyze`, {
        subjectName,
        boardName: selectedBoardName,
        standardOrSemester,
        instructions,
      });

      if (res.data.success) {
        setStructuredUnits(res.data.result.units || []);
        setSyllabusSummary(res.data.result.summary || '');
        setCurrentStep(2);
      }
    } catch (err: any) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzingSyllabus(false);
    }
  };

  // Step 4: Finalize & Generate Question Paper
  const handleGeneratePaper = async () => {
    setGenerating(true);
    setGenerationError('');

    try {
      // 1. Create Paper Record
      const createRes = await api.post('/papers', {
        title: `${examName} - ${subjectName}`,
        institutionName,
        examName,
        subjectName,
        boardName: selectedBoardName,
        standardOrSemester,
        academicYear,
        durationMinutes,
        totalMarks,
        difficultyDistribution: difficulty,
        patternConfig: sections,
        instructionsText: instructions,
        syllabusDocId: extractedDoc?.id,
      });

      const paperId = createRes.data.paper.id;

      // 2. Trigger AI Question Generation
      await api.post(`/papers/${paperId}/generate`);

      // 3. Automatically trigger Answer Key synthesis
      await api.post(`/papers/${paperId}/answer-key/generate`).catch(() => {});

      // 4. Redirect to Paper Workbench
      navigate(`/papers/${paperId}`);
    } catch (err: any) {
      setGenerationError(err.response?.data?.message || 'Question generation failed. Please check inputs.');
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Wizard Header Progress Indicator */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create Question Paper</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              AI-driven multi-stage syllabus parsing, blueprint validation, and question synthesis
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold border border-brand-200">
            Step {currentStep} of 3
          </span>
        </div>

        {/* Step Tabs */}
        <div className="grid grid-cols-3 gap-2">
          <div
            className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
              currentStep === 1
                ? 'bg-brand-50 border-brand-300 text-brand-800'
                : currentStep > 1
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            {currentStep > 1 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <Upload className="w-4 h-4 flex-shrink-0" />
            )}
            <span>1. Syllabus Ingestion</span>
          </div>

          <div
            className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
              currentStep === 2
                ? 'bg-brand-50 border-brand-300 text-brand-800'
                : currentStep > 2
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            {currentStep > 2 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <BookOpen className="w-4 h-4 flex-shrink-0" />
            )}
            <span>2. AI Syllabus Analysis</span>
          </div>

          <div
            className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
              currentStep === 3
                ? 'bg-brand-50 border-brand-300 text-brand-800'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <Sliders className="w-4 h-4 flex-shrink-0" />
            <span>3. Blueprint & Synthesis</span>
          </div>
        </div>
      </div>

      {/* STEP 1: Syllabus Ingestion & Text Verification */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Step 1: Subject Details & Syllabus Upload</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload your syllabus in PDF or image format (JPG, PNG, WEBP). Multi-page documents and scanned images are processed with OCR.
            </p>
          </div>

          <form onSubmit={handleUploadSyllabus} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Thermodynamics / Physics / Computer Science"
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Educational Board / Category *
                </label>
                <select
                  value={boardId}
                  onChange={(e) => {
                    setBoardId(e.target.value);
                    const b = boards.find((item) => item.id === e.target.value);
                    if (b) setSelectedBoardName(b.name);
                  }}
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                >
                  {boards.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Standard / Class / Semester *
                </label>
                <input
                  type="text"
                  required
                  value={standardOrSemester}
                  onChange={(e) => setStandardOrSemester(e.target.value)}
                  placeholder="e.g. Higher Secondary (+2) / Semester IV / Grade 10"
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Medium of Instruction
                </label>
                <select
                  value={medium}
                  onChange={(e) => setMedium(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                >
                  <option value="English">English</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Bilingual">Bilingual (English & Tamil)</option>
                </select>
              </div>
            </div>

            {/* Drag and Drop File Upload Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Upload Syllabus Documents (PDF, JPG, PNG, WEBP) *
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-brand-500 transition bg-slate-50/50">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => {
                    if (e.target.files) {
                      setFiles(Array.from(e.target.files));
                    }
                  }}
                  className="hidden"
                  id="syllabus-file-input"
                />
                <label htmlFor="syllabus-file-input" className="cursor-pointer block">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    Click to select syllabus files or drag and drop
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports digital PDFs, multi-page PDFs, and scanned photos
                  </p>
                </label>

                {files.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap gap-2 justify-center">
                    {files.map((f, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5 text-brand-500" />
                        <span>{f.name}</span>
                        <span className="text-[10px] text-slate-400">({Math.round(f.size / 1024)} KB)</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {uploadError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {!extractedDoc && (
              <button
                type="submit"
                disabled={uploading || files.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-sm transition disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Processing Multi-page PDF / OCR Extraction...' : 'Extract & Verify Syllabus Text'}
              </button>
            )}
          </form>

          {/* User Verification of Extracted Syllabus Text */}
          {extractedDoc && (
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Extracted Syllabus Content</h3>
                    <p className="text-xs text-slate-500">
                      Estimated OCR / Extraction Confidence: {extractedDoc.ocrConfidence || 95}%
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSaveEditedText}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                >
                  Save Text Edits
                </button>
              </div>

              {savedTextSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium">
                  Extracted text verified and updated.
                </div>
              )}

              <textarea
                rows={8}
                value={editableRawText}
                onChange={(e) => setEditableRawText(e.target.value)}
                placeholder="Extracted syllabus text appears here for verification..."
                className="w-full p-4 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none leading-relaxed"
              />

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleAnalyzeSyllabus}
                  disabled={analyzingSyllabus || editableRawText.trim().length < 20}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-600/30 transition disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {analyzingSyllabus ? 'AI Analyzing Units & Topics...' : 'Run AI Syllabus Analysis'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: AI Syllabus Analysis Preview */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Step 2: AI Syllabus Analysis Preview</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify that all units, topics, and Bloom's cognitive taxonomy levels are properly structured before question generation.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              {structuredUnits.length} Units Identified
            </span>
          </div>

          {syllabusSummary && (
            <div className="p-4 rounded-xl bg-brand-50/60 border border-brand-100 text-xs text-slate-700 leading-relaxed">
              <span className="font-semibold text-brand-900">Curriculum Scope: </span>
              {syllabusSummary}
            </div>
          )}

          {/* Units and Topics Accordion/Table */}
          <div className="space-y-4">
            {structuredUnits.map((unit) => (
              <div
                key={unit.unitNumber}
                className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition bg-white space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                      {unit.unitNumber}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{unit.title}</h3>
                      <p className="text-xs text-slate-500">{unit.description}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-xs border border-indigo-200">
                    ~{unit.weightagePercent}% Weightage
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {unit.topics.map((t, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-1">
                      <p className="font-semibold text-slate-800">{t.topicName}</p>
                      {t.subtopicsJson && (
                        <p className="text-[11px] text-slate-500">
                          {JSON.parse(t.subtopicsJson).join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Syllabus Upload</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-600/30 transition"
            >
              <span>Approve & Configure Exam Pattern</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Examination Blueprint, Mark Distribution & Synthesis */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Step 3: Examination Configuration & Question Pattern</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize mark distribution, question counts, and difficulty levels. Mathematical sanity is validated automatically.
            </p>
          </div>

          {/* Exam Header Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Academy / Institution Name
              </label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Examination Title
              </label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Total Marks Target
              </label>
              <input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
                className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold text-brand-600"
              />
            </div>
          </div>

          {/* Difficulty Configuration */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Difficulty Calibration</h3>
                <p className="text-[11px] text-slate-500">Tune cognitive complexity (Bloom's Taxonomy)</p>
              </div>
              <div className="flex gap-2">
                {(['BASIC', 'MEDIUM', 'HARD', 'MIXED'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDifficulty({ ...difficulty, mode: m })}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      difficulty.mode === m
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {difficulty.mode === 'MIXED' && (
              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-200">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-emerald-700">Basic (Recall/Knowledge)</span>
                    <span className="font-bold">{difficulty.basicPercentage}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={difficulty.basicPercentage}
                    onChange={(e) =>
                      setDifficulty({ ...difficulty, basicPercentage: Number(e.target.value) })
                    }
                    className="w-full accent-emerald-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-brand-700">Medium (Application)</span>
                    <span className="font-bold">{difficulty.mediumPercentage}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={difficulty.mediumPercentage}
                    onChange={(e) =>
                      setDifficulty({ ...difficulty, mediumPercentage: Number(e.target.value) })
                    }
                    className="w-full accent-brand-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-rose-700">Hard (Analytical/HOTS)</span>
                    <span className="font-bold">{difficulty.hardPercentage}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={difficulty.hardPercentage}
                    onChange={(e) =>
                      setDifficulty({ ...difficulty, hardPercentage: Number(e.target.value) })
                    }
                    className="w-full accent-rose-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section Pattern Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Custom Examination Pattern & Sections
                </h3>
                <p className="text-[11px] text-slate-500">Configure questions per section, mark value, and choices</p>
              </div>

              <button
                type="button"
                onClick={addSection}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-xs border border-brand-200 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Section</span>
              </button>
            </div>

            <div className="space-y-3">
              {sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                >
                  <div className="sm:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Section</label>
                    <input
                      type="text"
                      value={sec.sectionName}
                      onChange={(e) => updateSection(idx, { sectionName: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Title</label>
                    <input
                      type="text"
                      value={sec.sectionTitle}
                      onChange={(e) => updateSection(idx, { sectionTitle: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Question Type</label>
                    <select
                      value={sec.questionType}
                      onChange={(e) => updateSection(idx, { questionType: e.target.value as any })}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="MCQ">MCQ (1 Mark)</option>
                      <option value="SHORT_ANSWER">Short Answer</option>
                      <option value="LONG_ANSWER">Long Answer</option>
                      <option value="ESSAY">Essay</option>
                      <option value="NUMERICAL">Numerical Problem</option>
                      <option value="APPLICATION">Case / Application</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={sec.numberOfQuestions}
                      onChange={(e) => updateSection(idx, { numberOfQuestions: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Marks/Q</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        value={sec.marksPerQuestion}
                        onChange={(e) => updateSection(idx, { marksPerQuestion: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                      />
                      <span className="text-xs font-bold text-slate-700 min-w-[36px]">
                        ={sec.totalSectionMarks}m
                      </span>
                    </div>
                  </div>

                  <div className="sm:col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => removeSection(idx)}
                      disabled={sections.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mathematical Validation Pill */}
          <div
            className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
              marksMatch
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {marksMatch ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              )}
              <div>
                <p className="font-bold">
                  {marksMatch
                    ? 'Mathematical Validation Passed: Total Marks Match Exactly'
                    : `Mark Distribution Mismatch: Section sum is ${calculatedTotalMarks} Marks (Target: ${totalMarks} Marks)`}
                </p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  Sum of sections: {calculatedTotalMarks} Marks | Total required: {totalMarks} Marks
                </p>
              </div>
            </div>

            <div className="font-mono text-sm font-bold">
              {calculatedTotalMarks} / {totalMarks} Marks
            </div>
          </div>

          {generationError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{generationError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Syllabus Preview</span>
            </button>

            <button
              type="button"
              disabled={generating || !marksMatch}
              onClick={handleGeneratePaper}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{generating ? 'AI Generating Examination Paper...' : 'Generate Full Question Paper'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

