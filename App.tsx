
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateQuiz from './pages/CreateQuiz';
import QuizHistory from './pages/QuizHistory';
import ContentManagement from './pages/Admin/ContentManagement';
import ApiKeys from './pages/Admin/ApiKeys';
import SiteSettings from './pages/Admin/SiteSettings';
import UserManagement from './pages/Admin/UserManagement';
import SystemLogs from './pages/Admin/SystemLogs';
import QuizView from './pages/QuizView';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const session = localStorage.getItem('edugenius_session');
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const sessionStr = localStorage.getItem('edugenius_session');
  if (!sessionStr) return <Navigate to="/login" replace />;
  
  const session = JSON.parse(sessionStr);
  if (session.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/view/:id" element={<QuizView />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        
        <Route path="/create" element={
          <ProtectedRoute><CreateQuiz /></ProtectedRoute>
        } />

        <Route path="/history" element={
          <ProtectedRoute><QuizHistory /></ProtectedRoute>
        } />

        {/* Restricted to Admin only */}
        <Route path="/content" element={
          <AdminRoute><ContentManagement /></AdminRoute>
        } />

        {/* Admin Only Routes */}
        <Route path="/admin/keys" element={
          <AdminRoute><ApiKeys /></AdminRoute>
        } />

        <Route path="/admin/users" element={
          <AdminRoute><UserManagement /></AdminRoute>
        } />

        <Route path="/admin/settings" element={
          <AdminRoute><SiteSettings /></AdminRoute>
        } />

        <Route path="/admin/logs" element={
          <AdminRoute><SystemLogs /></AdminRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
