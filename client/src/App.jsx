import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layout wrappers
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Guard wrappers
import { ProtectedRoute, RoleRoute } from './routes/ProtectedRoute';

// Public pages
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';

// Dashboard role pages
import StudentDashboard from './pages/StudentDashboard';
import ProfessorDashboard from './pages/ProfessorDashboard';
import ClubDashboard from './pages/ClubDashboard';
import JudgeDashboard from './pages/JudgeDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routing pathways */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
          </Route>

          {/* Secure/Protected pathways */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              {/* Student features workspace */}
              <Route element={<RoleRoute allowedRoles={['student']} />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/quizzes" element={<Navigate to="/student/dashboard" replace />} />
                <Route path="/student/hackathons" element={<Navigate to="/student/dashboard" replace />} />
              </Route>

              {/* Professor features workspace */}
              <Route element={<RoleRoute allowedRoles={['professor']} />}>
                <Route path="/professor/dashboard" element={<ProfessorDashboard />} />
                <Route path="/professor/quizzes" element={<Navigate to="/professor/dashboard" replace />} />
              </Route>

              {/* Club admin features workspace */}
              <Route element={<RoleRoute allowedRoles={['club_admin']} />}>
                <Route path="/club/dashboard" element={<ClubDashboard />} />
                <Route path="/club/profile" element={<Navigate to="/club/dashboard" replace />} />
                <Route path="/club/hackathons" element={<Navigate to="/club/dashboard" replace />} />
              </Route>

              {/* Judge features workspace */}
              <Route element={<RoleRoute allowedRoles={['judge']} />}>
                <Route path="/judge/dashboard" element={<JudgeDashboard />} />
                <Route path="/judge/submissions" element={<Navigate to="/judge/dashboard" replace />} />
              </Route>

              {/* System Admin workspace */}
              <Route element={<RoleRoute allowedRoles={['admin']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/approvals" element={<Navigate to="/admin/dashboard" replace />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all navigation fallback redirection */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
