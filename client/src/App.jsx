import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';

// Layout wrappers
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Guard wrappers
import { ProtectedRoute, RoleRoute } from './routes/ProtectedRoute';

// Lazy-loaded Public pages
const Welcome = React.lazy(() => import('./pages/Welcome'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Unauthorized = React.lazy(() => import('./pages/Unauthorized'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));

// Lazy-loaded Student features workspace
const StudentDashboard = React.lazy(() => import('./pages/StudentDashboard'));
const StudentQuizzes = React.lazy(() => import('./pages/StudentQuizzes'));
const StudentQuizAttempt = React.lazy(() => import('./pages/StudentQuizAttempt'));
const StudentQuizResult = React.lazy(() => import('./pages/StudentQuizResult'));
const StudentHackathons = React.lazy(() => import('./pages/StudentHackathons'));
const StudentTeams = React.lazy(() => import('./pages/StudentTeams'));
const StudentSubmissions = React.lazy(() => import('./pages/StudentSubmissions'));
const StudentAnnouncements = React.lazy(() => import('./pages/StudentAnnouncements'));
const StudentNotifications = React.lazy(() => import('./pages/StudentNotifications'));
const StudentProfilePage = React.lazy(() => import('./pages/StudentProfilePage'));

// Lazy-loaded Professor features workspace
const ProfessorDashboard = React.lazy(() => import('./pages/ProfessorDashboard'));
const ProfessorQuizzes = React.lazy(() => import('./pages/ProfessorQuizzes'));
const ProfessorQuizCreate = React.lazy(() => import('./pages/ProfessorQuizCreate'));
const ProfessorQuestions = React.lazy(() => import('./pages/ProfessorQuestions'));
const ProfessorQuizPreview = React.lazy(() => import('./pages/ProfessorQuizPreview'));
const ProfessorQuizResults = React.lazy(() => import('./pages/ProfessorQuizResults'));

// Lazy-loaded Club admin features workspace
const ClubDashboard = React.lazy(() => import('./pages/ClubDashboard'));
const ClubProfile = React.lazy(() => import('./pages/ClubProfile'));
const ClubHackathons = React.lazy(() => import('./pages/ClubHackathons'));
const ClubHackathonCreate = React.lazy(() => import('./pages/ClubHackathonCreate'));
const ClubHackathonPreview = React.lazy(() => import('./pages/ClubHackathonPreview'));
const StudentHackathonDetail = React.lazy(() => import('./pages/StudentHackathonDetail'));

// Lazy-loaded Judge features workspace
const JudgeDashboard = React.lazy(() => import('./pages/JudgeDashboard'));
const JudgeSubmissions = React.lazy(() => import('./pages/JudgeSubmissions'));
const JudgeEvaluate = React.lazy(() => import('./pages/JudgeEvaluate'));

// Lazy-loaded System Admin workspace
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminApprovals = React.lazy(() => import('./pages/AdminApprovals'));
const ChangePassword = React.lazy(() => import('./pages/ChangePassword'));
const AccountSecurity = React.lazy(() => import('./pages/AccountSecurity'));

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <React.Suspense fallback={<LoadingSpinner size="lg" className="h-screen flex justify-center items-center" />}>
            <Routes>
              {/* Public routing pathways */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Welcome />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
              </Route>

              {/* Secure/Protected pathways */}
              <Route element={<ProtectedRoute />}>
                <Route path="/change-password" element={<ChangePassword />} />
                <Route element={<DashboardLayout />}>
                  {/* Account Security (All Roles) */}
                  <Route path="/account/security" element={<AccountSecurity />} />

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
          </React.Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
