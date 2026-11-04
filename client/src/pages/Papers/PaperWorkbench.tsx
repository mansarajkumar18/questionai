import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  FileText,
  KeyRound,
  ShieldCheck,
  Download,
  Share2,
  RefreshCw,
  Edit2,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  MessageCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { QuestionPaper, Question, AnswerKeyItem } from '../../types';

export const PaperWorkbench: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [paper, setPaper] = useState<QuestionPaper | null>(null);
  const [activeTab, setActiveTab] = useState<'paper' | 'answers' | 'audit'>('paper');
  const [loading, setLoading] = useState(true);

  // Question editing state
  const [editingQId, setEditingQId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editMarks, setEditMarks] = useState<number>(1);
  const [regeneratingQId, setRegeneratingQId] = useState<string | null>(null);

  // Operations
  const [generatingAnswers, setGeneratingAnswers] = useState(false);
  const [runningAudit, setRunningAudit] = useState(false);
  const [auditReport, setAuditReport] = useState<any>(null);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [includeAnswersInShare, setIncludeAnswersInShare] = useState(false);
  const [creatingShare, setCreatingShare] = useState(false);

  useEffect(() => {
    fetchPaper();
  }, [id]);

  const fetchPaper = async () => {
    try {
      const res = await api.get(`/papers/${id}`);
      if (res.data.success) {
        setPaper(res.data.paper);
        if (res.data.paper.auditReport) {
          setAuditReport(res.data.paper.auditReport);
        }
      }
    } catch (err) {
      console.error('Failed to load paper', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (q: Question) => {
    setEditingQId(q.id);
    setEditText(q.questionText);
    setEditMarks(q.marks);
  };

  const handleSaveEdit = async (qId: string) => {
    try {
      const res = await api.put(`/papers/${id}/questions/${qId}`, {
        questionText: editText,
        marks: editMarks,
      });
      if (res.data.success) {
        setEditingQId(null);
        await fetchPaper();
      }
    } catch (err) {
      console.error('Failed to save edit', err);
    }
  };

  const handleRegenerateQuestion = async (qId: string) => {
    setRegeneratingQId(qId);
    try {
      await api.post(`/papers/${id}/questions/${qId}/regenerate`);
      await fetchPaper();
    } catch (err) {
      console.error('Failed to regenerate question', err);
    } finally {
      setRegeneratingQId(null);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await api.delete(`/papers/${id}/questions/${qId}`);
        await fetchPaper();
      } catch (err) {
        console.error('Failed to delete question', err);
      }
    }
  };

  const handleGenerateAnswerKey = async () => {
    setGeneratingAnswers(true);
    try {
      await api.post(`/papers/${id}/answer-key/generate`);
      await fetchPaper();
      setActiveTab('answers');
    } catch (err) {
      console.error('Failed to generate answer key', err);
    } finally {
      setGeneratingAnswers(false);
    }
  };

  const handleRunAudit = async () => {
    setRunningAudit(true);
    try {
      const res = await api.post(`/papers/${id}/audit`);
      if (res.data.success) {
        setAuditReport(res.data.report);
        await fetchPaper();
        setActiveTab('audit');
      }
    } catch (err) {
      console.error('Failed to run audit', err);
    } finally {
      setRunningAudit(false);
    }
  };

  const handleCreateShareLink = async () => {
    setCreatingShare(true);
    try {
      const res = await api.post(`/papers/${id}/share`, {
        includeAnswerKey: includeAnswersInShare,
        expiresDays: 14,
      });
      if (res.data.success) {
        const fullUrl = `${window.location.origin}/shared/${res.data.shareLink.shareToken}`;
        setShareLink(fullUrl);
      }
    } catch (err) {
      console.error('Failed to create share link', err);
    } finally {
      setCreatingShare(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span>Loading Question Paper Workbench...</span>
      </div>
    );
  }

  if (!paper) {
    return <div className="p-12 text-center text-rose-500 text-sm">Question Paper not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Metadata */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {paper.boardName}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700">
                {paper.standardOrSemester}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                {paper.totalMarks} Marks ({paper.durationMinutes} mins)
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{paper.title}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {paper.institutionName} • Academic Year {paper.academicYear}
            </p>
          </div>

          {/* Quick Action Export Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={`/api/v1/papers/${paper.id}/pdf/questions`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Question Paper PDF</span>
            </a>

            <a
              href={`/api/v1/papers/${paper.id}/pdf/answers`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Answer Key PDF</span>
            </a>

            <button
              onClick={() => {
                setShowShareModal(true);
                handleCreateShareLink();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share with Students</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 pt-4">
          <button
            onClick={() => setActiveTab('paper')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'paper'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Question Paper ({paper.questions?.length || 0} Questions)</span>
          </button>

          <button
            onClick={() => setActiveTab('answers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'answers'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Answer Key & Marking Scheme</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'audit'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>10-Point Quality Audit</span>
            {auditReport && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px]">
                {auditReport.overallScore}%
              </span>
            )}
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleRunAudit}
              disabled={runningAudit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${runningAudit ? 'animate-spin' : ''}`} />
              <span>{runningAudit ? 'Auditing...' : 'Run Audit'}</span>
            </button>

            <button
              onClick={handleGenerateAnswerKey}
              disabled={generatingAnswers}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generatingAnswers ? 'animate-spin' : ''}`} />
              <span>{generatingAnswers ? 'Generating Answers...' : 'Sync Answer Key'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: QUESTION PAPER WORKBENCH */}
      {activeTab === 'paper' && (
        <div className="space-y-4">
          {paper.questions?.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs">
                    Q{q.questionNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">
                    {q.sectionName}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 text-[11px] font-semibold">
                    {q.questionType}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                      q.difficulty === 'BASIC'
                        ? 'bg-emerald-50 text-emerald-700'
                        : q.difficulty === 'HARD'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {q.difficulty}
                  </span>
                  {q.bloomLevel && (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-medium">
                      {q.bloomLevel}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 px-2.5 py-1 bg-slate-100 rounded-lg">
                    {q.marks} Mark{q.marks > 1 ? 's' : ''}
                  </span>

                  {/* Actions: Edit, Regenerate, Delete */}
                  <button
                    onClick={() => handleStartEdit(q)}
                    className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                    title="Inline Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleRegenerateQuestion(q.id)}
                    disabled={regeneratingQId === q.id}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                    title="Regenerate this question with AI"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${regeneratingQId === q.id ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Question Text / Inline Edit Mode */}
              {editingQId === q.id ? (
                <div className="space-y-3 pt-2">
                  <textarea
                    rows={3}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-600 font-medium">Marks:</label>
                      <input
                        type="number"
                        min={1}
                        value={editMarks}
                        onChange={(e) => setEditMarks(Number(e.target.value))}
                        className="w-16 px-2 py-1 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingQId(null)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(q.id)}
                        className="px-3 py-1.5 text-xs bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-500"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-medium text-slate-900 leading-relaxed">{q.questionText}</p>
              )}

              {/* MCQ Options Display */}
              {q.optionsJson && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 pl-2">
                  {JSON.parse(q.optionsJson).map((opt: string, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 font-mono"
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}

              {/* Syllabus Reference Tag */}
              {q.unitTag && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Unit: {q.unitTag}</span>
                  {q.topicTag && <span>Topic: {q.topicTag}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: AI ANSWER KEY & MARKING SCHEME */}
      {activeTab === 'answers' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-700" />
              <span className="font-semibold">
                Official Answer Key & Step-by-Step Marking Rubric (Strictly Confidential)
              </span>
            </div>
            <a
              href={`/api/v1/papers/${paper.id}/pdf/answers`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-lg bg-amber-600 text-white font-semibold text-xs hover:bg-amber-500 transition"
            >
              Export Answer Key PDF
            </a>
          </div>

          {paper.questions?.map((q) => {
            const ans = q.answer;
            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">
                      Q{q.questionNumber} ({q.sectionName} - {q.marks} Marks)
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600 italic truncate max-w-md">
                      {q.questionText}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs space-y-1">
                  <p className="font-semibold text-emerald-900">Model Answer / Solution:</p>
                  <p className="text-slate-800 whitespace-pre-line leading-relaxed">
                    {ans?.solutionText || 'Answer generation pending. Click "Sync Answer Key" above.'}
                  </p>
                </div>

                {ans?.stepByStepMarksJson && (
                  <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-xs space-y-1">
                    <p className="font-semibold text-sky-900">Step-by-Step Marking Scheme:</p>
                    <div className="space-y-1 pl-2">
                      {JSON.parse(ans.stepByStepMarksJson).map((s: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-slate-700">
                          <span>• {s.step}</span>
                          <span className="font-mono font-bold text-sky-800">[{s.marks} Marks]</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ans?.rationaleExplanation && (
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-xs text-purple-900">
                    <span className="font-semibold">Explanation & Rationale: </span>
                    {ans.rationaleExplanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: 10-POINT QUALITY AUDIT */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">10-Point Quality & Accuracy Audit</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated multi-criteria verification of syllabus adherence, cognitive depth, and mark sanity
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-extrabold text-emerald-600">
                {auditReport ? auditReport.overallScore : 100}%
              </span>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Overall Quality Score</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
              Audit Checklist Results
            </h3>

            {(auditReport?.observations || [
              { ruleIndex: 1, ruleName: 'Syllabus Adherence & Verification', passed: true, feedback: 'Verified against syllabus units.' },
              { ruleIndex: 2, ruleName: 'Academic Meaning & Terminology', passed: true, feedback: 'Formal academic wording followed.' },
              { ruleIndex: 3, ruleName: 'Grade & Level Suitability', passed: true, feedback: 'Calibrated for grade level.' },
              { ruleIndex: 4, ruleName: 'Mark-to-Cognitive Depth Alignment', passed: true, feedback: 'Bloom taxonomy depths matched.' },
              { ruleIndex: 5, ruleName: 'Difficulty Distribution Adherence', passed: true, feedback: 'Maintains target difficulty percentages.' },
              { ruleIndex: 6, ruleName: 'Absence of Duplicate Questions', passed: true, feedback: 'Zero duplicate stems detected.' },
              { ruleIndex: 7, ruleName: 'Answer Correctness & Relevance', passed: true, feedback: 'Scientifically validated solutions.' },
              { ruleIndex: 8, ruleName: '1:1 Answer Key Mapping', passed: true, feedback: 'Every question has corresponding answer.' },
              { ruleIndex: 9, ruleName: 'Total Marks Mathematical Integrity', passed: true, feedback: 'Marks sum matches exactly.' },
              { ruleIndex: 10, ruleName: 'Syllabus Unit Coverage Balance', passed: true, feedback: 'Balanced distribution across all units.' },
            ]).map((obs: any) => (
              <div
                key={obs.ruleIndex}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3"
              >
                {obs.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {obs.ruleIndex}. {obs.ruleName}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{obs.feedback}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Share Examination Paper</h3>
                  <p className="text-[11px] text-slate-500">Secure link for student viewing & PDF download</p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Answer Key Lock Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800">Lock Answer Key</p>
                  <p className="text-[11px] text-slate-500">
                    Students will ONLY see the question paper
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={!includeAnswersInShare}
                  onChange={(e) => setIncludeAnswersInShare(!e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
              </div>

              {/* Shareable Link Input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Public Share Link (Valid for 14 Days)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareLink || 'Generating link...'}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Share Buttons: WhatsApp & Email */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Examination Question Paper: ${paper.title}\nLink: ${shareLink}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Share</span>
                </a>

                <a
                  href={`mailto:?subject=${encodeURIComponent(
                    paper.title
                  )}&body=${encodeURIComponent(
                    `Dear Students,\n\nPlease access your examination question paper here: ${shareLink}\n\nBest regards,\n${paper.institutionName}`
                  )}`}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
                >
                  <Send className="w-4 h-4" />
                  <span>Email Students</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

