import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Key,
  CheckCircle2,
  XCircle,
  Building2,
  Save,
  HelpCircle,
  Cpu,
  RefreshCw,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, refreshUser } = useAuth();

  // AI Configuration state
  const [apiKey, setApiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [model, setModel] = useState('gemini-2.5-flash');
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    model?: string;
  } | null>(null);
  const [savingAi, setSavingAi] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Institution branding state
  const [instName, setInstName] = useState(user?.institution?.name || '');
  const [instAddress, setInstAddress] = useState(user?.institution?.address || '');
  const [instEmail, setInstEmail] = useState(user?.institution?.contactEmail || '');
  const [savingInst, setSavingInst] = useState(false);
  const [instSaveSuccess, setInstSaveSuccess] = useState(false);

  useEffect(() => {
    fetchAiSettings();
  }, []);

  const fetchAiSettings = async () => {
    try {
      const res = await api.get('/settings/ai');
      if (res.data.success) {
        setIsConfigured(res.data.isConfigured);
        setMaskedKey(res.data.maskedKey || '');
        setModel(res.data.model);
        setAvailableModels(res.data.availableModels || []);
      }
    } catch (err) {
      console.error('Failed to load AI settings', err);
    }
  };

  const handleTestConnection = async () => {
    setTestingKey(true);
    setTestResult(null);
    try {
      const res = await api.post('/settings/ai/test', {
        apiKey: apiKey.trim() || undefined,
      });
      setTestResult(res.data);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || 'Connection test failed.',
      });
    } finally {
      setTestingKey(false);
    }
  };

  const handleSaveAiSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAi(true);
    setSaveSuccess(false);
    try {
      const res = await api.put('/settings/ai', {
        apiKey: apiKey.trim() ? apiKey.trim() : undefined,
        model,
      });
      if (res.data.success) {
        setSaveSuccess(true);
        setApiKey('');
        await fetchAiSettings();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving AI settings:', err);
    } finally {
      setSavingAi(false);
    }
  };

  const handleSaveInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInst(true);
    setInstSaveSuccess(false);
    try {
      const res = await api.put('/settings/institution', {
        name: instName,
        address: instAddress,
        contactEmail: instEmail,
      });
      if (res.data.success) {
        setInstSaveSuccess(true);
        if (res.data.institution) {
          const updatedUser = {
            ...user,
            institution: res.data.institution,
          };
          localStorage.setItem('qgen_user', JSON.stringify(updatedUser));
          await refreshUser();
        }
        setTimeout(() => setInstSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save institution info', err);
    } finally {
      setSavingInst(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure independent AI service provider credentials and examination header branding.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Modular AI Service Configuration Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">AI Engine Provider</h2>
                <p className="text-xs text-slate-500">Google Gemini API (Official SDK)</p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                isConfigured
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {isConfigured ? 'Active & Ready' : 'Key Required'}
            </span>
          </div>

          <form onSubmit={handleSaveAiSettings} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Gemini API Key
                </label>
                {maskedKey && (
                  <span className="text-xs font-mono text-slate-400">Current: {maskedKey}</span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    isConfigured
                      ? 'Enter new key to replace existing'
                      : 'AIzaSy...'
                  }
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Keys are stored securely in your independent SQLite database or .env file.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                AI Reasoning Model
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                >
                  {availableModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{testResult.message}</p>
                  {testResult.latencyMs && (
                    <p className="text-[10px] text-emerald-600 mt-0.5">
                      Response latency: {testResult.latencyMs}ms | Model: {testResult.model}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingKey}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingKey ? 'animate-spin' : ''}`} />
                {testingKey ? 'Testing Connection...' : 'Test AI Connection'}
              </button>

              <button
                type="submit"
                disabled={savingAi}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-sm transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {savingAi ? 'Saving...' : saveSuccess ? 'Saved Successfully!' : 'Save AI Configuration'}
              </button>
            </div>
          </form>
        </div>

        {/* Institution Profile & Branding Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Institution Header & Branding</h2>
              <p className="text-xs text-slate-500">
                Printed on top of every generated examination paper and answer key
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveInstitution} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Academy / School / College Name
              </label>
              <input
                type="text"
                required
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                placeholder="e.g. Apex Institute of Science & Technology"
                className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Address & Affiliation Header
              </label>
              <input
                type="text"
                value={instAddress}
                onChange={(e) => setInstAddress(e.target.value)}
                placeholder="e.g. Approved by AICTE, Affiliated to Anna University, Chennai - 600025"
                className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Examination Department Contact Email
              </label>
              <input
                type="email"
                value={instEmail}
                onChange={(e) => setInstEmail(e.target.value)}
                placeholder="coe@institution.edu"
                className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            {instSaveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Institution details updated successfully.</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingInst}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {savingInst ? 'Updating...' : 'Update Institution Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
