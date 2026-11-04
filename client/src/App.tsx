import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { CreateWizard } from './pages/CreatePaper/CreateWizard';
import { PaperWorkbench } from './pages/Papers/PaperWorkbench';
import { SyllabusLibrary } from './pages/Syllabus/SyllabusLibrary';
import { PapersList } from './pages/Papers/PapersList';
import { PublicSharedView } from './pages/Shared/PublicSharedView';
import { QuestionBank } from './pages/QuestionBank/QuestionBank';
import { AnswerKeysList } from './pages/AnswerKeys/AnswerKeysList';
import { SharedManager } from './pages/Shared/SharedManager';
import { UserProfile } from './pages/Profile/UserProfile';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span>Initializing Q-GEN AI...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/shared/:token" element={<PublicSharedView />} />

        {/* Protected Application Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="create" element={<CreateWizard />} />
          <Route path="papers/:id" element={<PaperWorkbench />} />
          <Route path="syllabus" element={<SyllabusLibrary />} />
          <Route path="papers" element={<PapersList />} />
          <Route path="settings" element={<Settings />} />
          <Route path="questions" element={<QuestionBank />} />
          <Route path="answers" element={<AnswerKeysList />} />
          <Route path="shared-docs" element={<SharedManager />} />
          <Route path="profile" element={<UserProfile />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
