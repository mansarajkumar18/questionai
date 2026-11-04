import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { BookOpen, FileText, Trash2, Plus, Sparkles, ExternalLink } from 'lucide-react';
import { SyllabusDocument } from '../../types';

export const SyllabusLibrary: React.FC = () => {
  const [syllabi, setSyllabi] = useState<SyllabusDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<SyllabusDocument | null>(null);

  useEffect(() => {
    fetchSyllabi();
  }, []);

  const fetchSyllabi = async () => {
    try {
      const res = await api.get('/syllabus');
      if (res.data.success) {
        setSyllabi(res.data.documents);
      }
    } catch (err) {
      console.error('Failed to load syllabi', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this syllabus document?')) {
      try {
        await api.delete(`/syllabus/${id}`);
        fetchSyllabi();
      } catch (err) {
        console.error('Delete failed', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Syllabus Library</h1>
          <p className="text-xs text-slate-500 mt-1">
            Uploaded multi-page PDFs, scanned syllabi, and structured curriculum units
          </p>
        </div>

        <Link
          to="/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Upload & Ingest Syllabus</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading syllabus documents...</div>
      ) : syllabi.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-sm mx-auto">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No syllabus uploaded yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Upload your first PDF or image syllabus to begin generating questions.
          </p>
          <Link
            to="/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Syllabus</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {syllabi.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold uppercase">
                    {doc.fileType.includes('pdf') ? 'PDF Document' : 'Image Scan / OCR'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {Math.round(doc.fileSize / 1024)} KB
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{doc.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {doc.originalFileName}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  <span>View Extracted Text</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Extracted Text Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">{selectedDoc.title}</h3>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <textarea
              readOnly
              rows={14}
              value={selectedDoc.extractedRawText}
              className="w-full p-4 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"
            />
          </div>
        </div>
      )}
    </div>
  );
};

