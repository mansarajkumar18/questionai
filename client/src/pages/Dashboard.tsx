import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FilePlus2,
  BookOpen,
  FileText,
  KeyRound,
  Share2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [papers, setPapers] = useState<any[]>([]);
  const [syllabi, setSyllabi] = useState<any[]>([]);
  const [stats, setStats] = useState({
    papersCount: 0,
    syllabiCount: 0,
    questionsCount: 0,
    sharedCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [papersRes, syllabiRes] = await Promise.allSettled([
        api.get('/papers'),
        api.get('/syllabus'),
      ]);

      let loadedPapers: any[] = [];
      let loadedSyllabi: any[] = [];

      if (papersRes.status === 'fulfilled' && papersRes.value.data.success) {
        loadedPapers = papersRes.value.data.papers || [];
        setPapers(loadedPapers);
      }
      if (syllabiRes.status === 'fulfilled' && syllabiRes.value.data.success) {
        loadedSyllabi = syllabiRes.value.data.documents || [];
        setSyllabi(loadedSyllabi);
      }

      setStats({
        papersCount: loadedPapers.length,
        syllabiCount: loadedSyllabi.length,
        questionsCount: loadedPapers.reduce(
          (sum: number, p: any) => sum + (p.questions?.length || 0),
          0
        ),
        sharedCount: loadedPapers.filter((p: any) => p.sharedLinks?.length > 0).length,
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white p-8 border border-slate-800 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>AI-Driven Examination Architecture</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Educator'}
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Generate mathematically sound, syllabus-aligned examination question papers and
            corresponding step-by-step answer keys in minutes.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 transition transform hover:-translate-y-0.5"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Generate New Question Paper</span>
            </Link>
            <Link
              to="/syllabus"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition"
            >
              <BookOpen className="w-4 h-4" />
              <span>Manage Syllabus Library</span>
            </Link>
          </div>
        </div>

        {/* Decorative background grid pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Question Papers</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{stats.papersCount}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Analysed Syllabi</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{stats.syllabiCount}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Generated Questions</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{stats.questionsCount}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Share Links</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{stats.sharedCount}</h3>
          </div>
        </div>
      </div>

      {/* Recent Question Papers Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Question Papers</h2>
            <p className="text-xs text-slate-500">Your examination papers, drafts, and audited blueprints</p>
          </div>
          <Link
            to="/papers"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View All Papers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading question papers...</div>
        ) : papers.length === 0 ? (
          <div className="p-12 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <FilePlus2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No question papers created yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Start by uploading your course syllabus or choosing an examination pattern.
            </p>
            <Link
              to="/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-sm transition"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Create First Paper</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">Examination & Subject</th>
                  <th className="py-3 px-4">Board / Category</th>
                  <th className="py-3 px-4">Marks & Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {papers.slice(0, 5).map((paper) => (
                  <tr key={paper.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-900 text-sm">{paper.title}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {paper.subjectName} • {paper.standardOrSemester}
                      </p>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-700">
                      {paper.boardName}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {paper.totalMarks} Marks • {paper.durationMinutes} mins
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          paper.status === 'FINALIZED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : paper.status === 'AUDITED'
                            ? 'bg-brand-50 text-brand-700 border border-brand-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {paper.status === 'FINALIZED' && <CheckCircle2 className="w-3 h-3" />}
                        {paper.status === 'AUDITED' && <Sparkles className="w-3 h-3" />}
                        {paper.status === 'DRAFT' && <Clock className="w-3 h-3" />}
                        {paper.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <Link
                        to={`/papers/${paper.id}`}
                        className="inline-block px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
                      >
                        Open Workbench
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

