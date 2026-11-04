import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { GraduationCap, Download, Clock, Award, BookOpen, AlertCircle, FileText } from 'lucide-react';

export const PublicSharedView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios
      .get(`/api/v1/public/share/${token}`)
      .then((res) => {
        if (res.data.success) {
          setData(res.data);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Unable to access this examination paper.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-slate-600 text-sm">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading Examination Question Paper...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 max-w-md w-full text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">Access Notice</h2>
          <p className="text-xs text-slate-500 mb-4">{error || 'This examination link is inactive or expired.'}</p>
        </div>
      </div>
    );
  }

  const { paper, share } = data;

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Examination Academic Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center relative overflow-hidden">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 items-center justify-center text-white shadow-md shadow-brand-500/20 mb-3">
            <GraduationCap className="w-7 h-7" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
            {paper.institutionName}
          </h1>
          <h2 className="text-base font-bold text-slate-800 mt-1">{paper.examName}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Academic Year {paper.academicYear} • {paper.boardName}
          </p>

          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Subject</span>
              <span className="font-bold text-slate-800">{paper.subjectName}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Standard</span>
              <span className="font-bold text-slate-800">{paper.standardOrSemester}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Duration</span>
              <span className="font-bold text-slate-800">{paper.durationMinutes} Minutes</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Marks</span>
              <span className="font-bold text-brand-600">{paper.totalMarks} Marks</span>
            </div>
          </div>

          {share.allowDownload && (
            <div className="mt-6 flex justify-center">
              <a
                href={`/api/v1/public/share/${token}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-600/30 transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Official Question Paper PDF</span>
              </a>
            </div>
          )}
        </div>

        {/* Candidate & General Instructions */}
        {paper.instructionsText && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-xs space-y-1.5">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Examination Instructions
            </h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">{paper.instructionsText}</p>
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-4">
          {paper.questions?.map((q: any) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    {q.questionNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold">
                    {q.sectionName}
                  </span>
                </div>
                <span className="font-bold text-xs text-slate-900 px-2.5 py-1 bg-slate-100 rounded-lg">
                  [{q.marks} Mark{q.marks > 1 ? 's' : ''}]
                </span>
              </div>

              <p className="text-sm font-medium text-slate-900 leading-relaxed">{q.questionText}</p>

              {q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-2">
                  {q.options.map((opt: string, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-mono text-slate-700"
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center py-6 text-xs text-slate-400">
          Generated via Q-GEN AI Independent Examination Architecture
        </div>
      </div>
    </div>
  );
};
