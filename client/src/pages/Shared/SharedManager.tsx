import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Share2, ExternalLink, Copy, Check, Lock, Globe } from 'lucide-react';

export const SharedManager: React.FC = () => {
  const [sharedPapers, setSharedPapers] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/papers').then(async (res) => {
      if (res.data.success && res.data.papers.length > 0) {
        const full = await Promise.all(
          res.data.papers.map((p: any) => api.get(`/papers/${p.id}`).then((r) => r.data.paper))
        );
        const allShared = full.flatMap((p: any) =>
          (p.sharedLinks || []).map((s: any) => ({
            ...s,
            paperTitle: p.title,
            subjectName: p.subjectName,
            totalMarks: p.totalMarks,
          }))
        );
        setSharedPapers(allShared);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleCopy = (token: string) => {
    const url = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(token);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shared Documents</h1>
        <p className="text-xs text-slate-500 mt-1">
          Active student access links, expiration schedules, and view statistics
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading shared documents...</div>
      ) : sharedPapers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-sm mx-auto">
          <Share2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500">
            No examination papers shared yet. Open any paper workbench and click "Share with Students".
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Examination Paper</th>
                <th className="py-3.5 px-4">Student Security</th>
                <th className="py-3.5 px-4">Views</th>
                <th className="py-3.5 px-4">Expires</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sharedPapers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-900 text-sm">{s.paperTitle}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">{s.subjectName}</p>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        !s.includeAnswerKey
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {!s.includeAnswerKey ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                      {!s.includeAnswerKey ? 'Answer Key Locked' : 'Answers Visible'}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-700">{s.viewCount} Views</td>
                  <td className="py-4 px-4 text-slate-500">
                    {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : 'Never expires'}
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button
                      onClick={() => handleCopy(s.shareToken)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                    >
                      {copiedId === s.shareToken ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedId === s.shareToken ? 'Copied' : 'Copy Link'}</span>
                    </button>

                    <a
                      href={`/shared/${s.shareToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
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

