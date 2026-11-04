import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { HelpCircle, Search, Filter, BookOpen, Layers } from 'lucide-react';

export const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Collect questions across all user papers
    api.get('/papers').then(async (res) => {
      if (res.data.success && res.data.papers.length > 0) {
        const fullPapers = await Promise.all(
          res.data.papers.map((p: any) => api.get(`/papers/${p.id}`).then((r) => r.data.paper))
        );
        const allQ = fullPapers.flatMap((p: any) =>
          (p.questions || []).map((q: any) => ({
            ...q,
            subjectName: p.subjectName,
            boardName: p.boardName,
            examName: p.examName,
          }))
        );
        setQuestions(allQ);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.topicTag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.subjectName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiff = selectedDifficulty === 'ALL' || q.difficulty === selectedDifficulty;
    const matchesType = selectedType === 'ALL' || q.questionType === selectedType;
    return matchesSearch && matchesDiff && matchesType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Question Bank</h1>
        <p className="text-xs text-slate-500 mt-1">
          Search and inspect all questions generated across your examinations
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions by keyword, topic, or subject..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
          >
            <option value="ALL">All Difficulties</option>
            <option value="BASIC">Basic</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
          >
            <option value="ALL">All Question Types</option>
            <option value="MCQ">MCQ</option>
            <option value="SHORT_ANSWER">Short Answer</option>
            <option value="LONG_ANSWER">Long Answer</option>
            <option value="NUMERICAL">Numerical</option>
            <option value="ESSAY">Essay</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading questions...</div>
      ) : filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-sm mx-auto">
          <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No questions match your filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2 hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                    {q.subjectName}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    {q.questionType}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      q.difficulty === 'BASIC'
                        ? 'bg-emerald-50 text-emerald-700'
                        : q.difficulty === 'HARD'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {q.difficulty}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                  {q.marks} Mark{q.marks > 1 ? 's' : ''}
                </span>
              </div>

              <p className="text-sm font-medium text-slate-900 leading-relaxed">{q.questionText}</p>

              {q.optionsJson && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-2">
                  {JSON.parse(q.optionsJson).map((opt: string, i: number) => (
                    <div key={i} className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded-lg">
                      {opt}
                    </div>
                  ))}
                </div>
              )}

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
    </div>
  );
};

