import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
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

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Direct Main Application - Open directly without login */}
        <Route path="/" element={<Layout />}>
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

        {/* Public Shared Student Link */}
        <Route path="/shared/:token" element={<PublicSharedView />} />

        {/* Authentication removed - redirect old auth links to direct dashboard */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
