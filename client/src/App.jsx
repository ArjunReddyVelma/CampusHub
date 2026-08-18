import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';

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
import NotFound from './pages/NotFound';

// Dashboard role pages
import StudentDashboard from './pages/StudentDashboard';
import StudentQuizzes from './pages/StudentQuizzes';
import StudentQuizAttempt from './pages/StudentQuizAttempt';
import StudentQuizResult from './pages/StudentQuizResult';
import StudentHackathons from './pages/StudentHackathons';
import StudentTeams from './pages/StudentTeams';
import StudentSubmissions from './pages/StudentSubmissions';
import StudentAnnouncements from './pages/StudentAnnouncements';
import StudentNotifications from './pages/StudentNotifications';
import StudentProfilePage from './pages/StudentProfilePage';

import ProfessorDashboard from './pages/ProfessorDashboard';
import ProfessorQuizzes from './pages/ProfessorQuizzes';
import ProfessorQuizCreate from './pages/ProfessorQuizCreate';
import ProfessorQuestions from './pages/ProfessorQuestions';
import ProfessorQuizPreview from './pages/ProfessorQuizPreview';
import ProfessorQuizResults from './pages/ProfessorQuizResults';

import ClubDashboard from './pages/ClubDashboard';
import ClubProfile from './pages/ClubProfile';
import ClubHackathons from './pages/ClubHackathons';
import ClubHackathonCreate from './pages/ClubHackathonCreate';
import ClubHackathonPreview from './pages/ClubHackathonPreview';

import StudentHackathonDetail from './pages/StudentHackathonDetail';

import JudgeDashboard from './pages/JudgeDashboard';
import JudgeSubmissions from './pages/JudgeSubmissions';
import JudgeEvaluate from './pages/JudgeEvaluate';

import AdminDashboard from './pages/AdminDashboard';
import AdminApprovals from './pages/AdminApprovals';

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
                <Route path="/student/quizzes" element={<StudentQuizzes />} />
                <Route path="/student/attempts/:id" element={<StudentQuizAttempt />} />
                <Route path="/student/results/:id" element={<StudentQuizResult />} />
                <Route path="/student/hackathons" element={<StudentHackathons />} />
                <Route path="/student/hackathons/:id" element={<StudentHackathonDetail />} />
                <Route path="/student/teams" element={<StudentTeams />} />
                <Route path="/student/submissions" element={<StudentSubmissions />} />
                <Route path="/student/announcements" element={<StudentAnnouncements />} />
                <Route path="/student/notifications" element={<StudentNotifications />} />
                <Route path="/student/profile" element={<StudentProfilePage />} />
              </Route>

              <Route element={<RoleRoute allowedRoles={['professor']} />}>
                <Route path="/professor/dashboard" element={<ProfessorDashboard />} />
                <Route path="/professor/quizzes" element={<ProfessorQuizzes />} />
                <Route path="/professor/quizzes/create" element={<ProfessorQuizCreate />} />
                <Route path="/professor/quizzes/:id/edit" element={<ProfessorQuizCreate />} />
                <Route path="/professor/quizzes/:id/questions" element={<ProfessorQuestions />} />
                <Route path="/professor/quizzes/:id/preview" element={<ProfessorQuizPreview />} />
                <Route path="/professor/quizzes/:id/results" element={<ProfessorQuizResults />} />
              </Route>

              {/* Club admin features workspace */}
              <Route element={<RoleRoute allowedRoles={['club_admin']} />}>
                <Route path="/club/dashboard" element={<ClubDashboard />} />
                <Route path="/club/profile" element={<ClubProfile />} />
                <Route path="/club/hackathons" element={<ClubHackathons />} />
                <Route path="/club/hackathons/create" element={<ClubHackathonCreate />} />
                <Route path="/club/hackathons/:id/edit" element={<ClubHackathonCreate />} />
                <Route path="/club/hackathons/:id/preview" element={<ClubHackathonPreview />} />
              </Route>

              {/* Judge features workspace */}
              <Route element={<RoleRoute allowedRoles={['judge']} />}>
                <Route path="/judge/dashboard" element={<JudgeDashboard />} />
                <Route path="/judge/submissions" element={<JudgeSubmissions />} />
                <Route path="/judge/submissions/:id/evaluate" element={<JudgeEvaluate />} />
              </Route>

              {/* System Admin workspace */}
              <Route element={<RoleRoute allowedRoles={['admin']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/approvals" element={<AdminApprovals />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all navigation fallback to NotFound */}
          <Route element={<PublicLayout />}>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
