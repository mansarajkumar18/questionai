import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { KeyRound, Download, ArrowRight } from 'lucide-react';
import { QuestionPaper } from '../../types';

export const AnswerKeysList: React.FC = () => {
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/papers').then((res) => {
      if (res.data.success) {
        setPapers(res.data.papers);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Answer Keys Repository</h1>
        <p className="text-xs text-slate-500 mt-1">
          Confidential marking schemes, step-by-step rubrics, and downloadable official answer keys
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading answer keys...</div>
      ) : papers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-sm mx-auto">
          <KeyRound className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No answer keys generated yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {papers.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition space-y-4"
            >
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold uppercase">
                  Confidential Answer Key
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-2">{p.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {p.subjectName} • {p.boardName} ({p.totalMarks} Marks)
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={`/api/v1/papers/${p.id}/pdf/answers`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Answer Key PDF</span>
                </a>

                <Link
                  to={`/papers/${p.id}`}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  <span>View in Workbench</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

