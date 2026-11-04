import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { FileText, Plus, Trash2, ArrowRight, Download, CheckCircle2 } from 'lucide-react';
import { QuestionPaper } from '../../types';

export const PapersList: React.FC = () => {
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      const res = await api.get('/papers');
      if (res.data.success) {
        setPapers(res.data.papers);
      }
    } catch (err) {
      console.error('Failed to load papers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this examination paper?')) {
      try {
        await api.delete(`/papers/${id}`);
        fetchPapers();
      } catch (err) {
        console.error('Failed to delete paper', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Generated Examination Papers</h1>
          <p className="text-xs text-slate-500 mt-1">
            Access, edit, audit, and download PDF examination question papers and answer keys
          </p>
        </div>

        <Link
          to="/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Question Paper</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading question papers...</div>
      ) : papers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-sm mx-auto">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No question papers found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Create your first syllabus-aligned examination question paper.
          </p>
          <Link
            to="/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Paper</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Title & Subject</th>
                <th className="py-3.5 px-4">Board & Standard</th>
                <th className="py-3.5 px-4">Marks & Time</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {papers.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-900 text-sm">{p.title}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">{p.institutionName}</p>
                  </td>
                  <td className="py-4 px-4 font-medium text-slate-700">
                    <p>{p.boardName}</p>
                    <p className="text-slate-400 text-[11px]">{p.standardOrSemester}</p>
                  </td>
                  <td className="py-4 px-4 text-slate-600">
                    <span className="font-bold text-slate-900">{p.totalMarks} Marks</span>
                    <p className="text-slate-400 text-[11px]">{p.durationMinutes} mins</p>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        p.status === 'AUDITED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-brand-50 text-brand-700 border border-brand-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {p.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <a
                      href={`/api/v1/papers/${p.id}/pdf/questions`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                      title="Quick Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </a>

                    <Link
                      to={`/papers/${p.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition"
                    >
                      <span>Workbench</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

