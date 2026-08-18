# CampusHub API Documentation

All API requests are prefixed with `/api/v1/`.

## 1. Health Checks
*   `GET /api/v1/health`: Checks system status.
    *   *Response*: `{"success": true, "message": "CampusHub API is healthy"}`

## 2. Authentication
*   `POST /api/v1/auth/register`: Disabled for public registration (returns `403 Forbidden`). Only enabled for compatibility tests if `ALLOW_PUBLIC_REGISTRATION=true` is set.
*   `POST /api/v1/auth/login`: Authenticate credentials, set HttpOnly Cookie token.
*   `POST /api/v1/auth/logout`: Expire HttpOnly Cookie token.
*   `GET /api/v1/auth/me`: Get current logged-in user profile.
*   `PATCH /api/v1/auth/change-password`: Change user password securely and clears `mustChangePassword = false`.

## 3. Profiles
*   `GET /api/v1/users/me`: Fetch profile.
*   `PATCH /api/v1/users/me`: Update profile data.

## 4. Quizzes
*   `GET /api/v1/quizzes`: Fetch available quizzes.
*   `POST /api/v1/quizzes`: Create new quiz (Professor).
*   `GET /api/v1/quizzes/:id`: Fetch specific quiz details.
*   `PATCH /api/v1/quizzes/:id`: Modify quiz configuration.
*   `DELETE /api/v1/quizzes/:id`: Remove quiz.

## 5. Quiz Questions
*   `POST /api/v1/quizzes/:quizId/questions`: Create question for quiz.
*   `PATCH /api/v1/questions/:id`: Update question.
*   `DELETE /api/v1/questions/:id`: Delete question.

## 6. Quiz Attempts
*   `POST /api/v1/quizzes/:quizId/attempts`: Begin new quiz attempt.
*   `GET /api/v1/attempts/:id`: Get attempt information (hiding answers unless submitted).
*   `POST /api/v1/attempts/:id/submit`: Evaluate and save submission answers.

## 7. Hackathons
*   `GET /api/v1/hackathons`: Find published hackathons.
*   `POST /api/v1/hackathons`: Add a hackathon (Club Admin).
*   `GET /api/v1/hackathons/:id`: Fetch specific hackathon details.
*   `PATCH /api/v1/hackathons/:id`: Edit hackathon.
*   `DELETE /api/v1/hackathons/:id`: Delete hackathon.

## 8. Teams & Invitations
*   `POST /api/v1/hackathons/:hackathonId/teams`: Form team.
*   `POST /api/v1/teams/:teamId/invite`: Send invite.
*   `POST /api/v1/team-invitations/:id/accept`: Accept invitation.
*   `POST /api/v1/team-invitations/:id/reject`: Decline invitation.

## 9. Submissions
*   `POST /api/v1/hackathons/:hackathonId/submissions`: Submit team project.
*   `GET /api/v1/submissions/:id`: Retrieve project details.
*   `PATCH /api/v1/submissions/:id`: Modify submission.

## 10. Judging & Evaluations
*   `GET /api/v1/judging/assignments`: Fetch assignments.
*   `POST /api/v1/submissions/:submissionId/evaluate`: Evaluate project submission.

## 11. Announcements & Notifications
*   `GET /api/v1/announcements`: Get list.
*   `POST /api/v1/announcements`: Create.
*   `GET /api/v1/notifications`: List database notifications.
*   `PATCH /api/v1/notifications/:id/read`: Mark as read.

## 12. System Admin
*   `GET /api/v1/admin/users`: List users.
*   `POST /api/v1/admin/users`: Create/provision a new university user (Student, Professor, Club Admin, Judge, Admin).
*   `POST /api/v1/admin/users/import`: Bulk import university users via raw CSV.
*   `GET /api/v1/admin/statistics`: Fetch platform usage logs.
*   `PATCH /api/v1/admin/users/:id/status`: Moderate user states.
