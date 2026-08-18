# CampusHub 🎓

> **A university digital campus platform for institution-managed authentication, academic assessments, clubs, hackathons, project submissions, judging, announcements, and administration.**

CampusHub is a full-stack MERN application designed around how a real university ERP/campus portal works: the institution provisions student and staff accounts, users sign in with university credentials, temporary credentials require a mandatory first-login password change, and access is controlled by role-based permissions.

---

## ✨ Highlights

- 🔐 **Institution-managed authentication**
  - Public registration disabled by default
  - Admin-provisioned student, professor, judge, club-admin, and admin accounts
  - Temporary-password first-login flow
  - Mandatory secure password change
  - Account suspension / activation
  - University email-domain validation support

- 👨‍🎓 **Student Workspace**
  - Dashboard
  - Academic quizzes
  - Quiz attempts and results
  - Hackathon discovery and registration
  - Team creation and invitations
  - Project submissions
  - Submission scorecards
  - Announcements and notifications
  - Student profile

- 👨‍🏫 **Professor Workspace**
  - Quiz creation
  - Question management
  - Quiz preview
  - Publishing and scheduling
  - Results and performance tracking

- 🏆 **Club Administration**
  - Club registration and moderation
  - Club profile management
  - Hackathon creation and publishing
  - Draft / published / upcoming / completed workflows
  - Team-size and time-bound validation
  - Judge assignment
  - Hackathon preview

- ⚖️ **Judge Portal**
  - Assigned-hackathon discovery
  - Project submission review
  - Repository and demo links
  - Dynamic judging rubrics
  - Per-criterion scoring
  - Judge feedback
  - Evaluation authorization boundaries
  - Automatic final-score calculation

- 🛡️ **System Administration**
  - Platform-wide metrics
  - User search and filtering
  - Role management
  - User suspension / activation
  - Club approval and suspension
  - Global announcements
  - Admin self-protection rules
  - Institution account provisioning
  - CSV bulk user import

- ⚡ **Production-oriented frontend**
  - React route-level code splitting
  - Lazy-loaded page chunks
  - Error boundary recovery UI
  - Dynamic document titles
  - Accessibility improvements
  - Loading-state screen-reader support

- 🧪 **Automated QA**
  - 13 regression / integration suites
  - Role-based security testing
  - Hackathon E2E workflows
  - Judge evaluation E2E
  - Admin E2E
  - Institution authentication E2E
  - CSV atomicity verification

---

## 🏗️ Architecture

```text
                        ┌─────────────────────────┐
                        │      CampusHub Web       │
                        │      React + Vite        │
                        └────────────┬────────────┘
                                     │
                              HTTPS / REST API
                                     │
                        ┌────────────▼────────────┐
                        │    Express REST API      │
                        │      Node.js backend     │
                        └────────────┬────────────┘
                                     │
                              Mongoose / MongoDB
                                     │
                        ┌────────────▼────────────┐
                        │      MongoDB Database    │
                        │   Local / MongoDB Atlas  │
                        └─────────────────────────┘
```

### Frontend

- React
- Vite
- React Router
- Axios
- Tailwind/CSS-based UI
- Lazy-loaded route modules

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JWT authentication
- HttpOnly cookies
- bcrypt password hashing
- Helmet
- CORS
- Morgan

---

## 👥 Role Model

CampusHub currently supports five operational roles:

| Role | Primary Responsibilities |
|---|---|
| **Student** | Quizzes, teams, hackathons, submissions, announcements |
| **Professor** | Quiz creation, questions, publishing, results |
| **Club Admin** | Clubs, hackathons, judges, team/event management |
| **Judge** | Assigned hackathon evaluation and scoring |
| **Admin** | Users, roles, club moderation, announcements, platform administration |

Authorization is enforced on both the frontend and backend. Frontend route guards improve UX, while backend middleware remains the security boundary.

---

# 🔐 Institution-Managed Authentication

CampusHub follows a university ERP-style account model.

### Normal user lifecycle

```text
University Administrator
        │
        ▼
Create student / professor / judge / club-admin account
        │
        ▼
Temporary credentials issued
        │
        ▼
User logs in
        │
        ▼
mustChangePassword = true
        │
        ▼
/change-password
        │
        ▼
Secure password created
        │
        ▼
mustChangePassword = false
        │
        ▼
Role-specific dashboard
```

### Security properties

- Passwords are hashed using bcrypt.
- Password fields are excluded from normal User queries.
- Authentication uses JWT-backed HttpOnly cookies.
- Production cookies use `secure: true`.
- Cross-origin production cookies use `SameSite=None`.
- Public registration is disabled unless explicitly enabled.
- Temporary-password users cannot access normal API resources until their password is changed.
- Suspended users cannot authenticate.
- Admins cannot suspend themselves.
- Admins cannot demote themselves.
- The final active administrator cannot be demoted or suspended.

---

# 🧩 Major Features

## 1. Authentication & Authorization

- Login
- Logout
- Current-user session restoration
- Role-based routing
- Protected routes
- Unauthorized route
- Account activation state
- First-login password enforcement
- Secure password policy
- Forgot-password / account security infrastructure

### Password policy

New passwords require:

- Minimum 8 characters
- Uppercase letter
- Lowercase letter
- Number
- Special character

---

## 2. Academic Quiz System

Professors can:

1. Create quizzes
2. Add questions
3. Configure quiz settings
4. Preview quizzes
5. Publish quizzes
6. Track quiz status
7. Review student results

Students can:

1. Discover available quizzes
2. Attempt quizzes
3. Submit answers
4. Receive scores
5. Review results

---

## 3. Clubs & Hackathons

Club admins can register clubs and manage hackathons after club approval.

Hackathon lifecycle:

```text
Draft
  ↓
Published
  ↓
Upcoming
  ↓
Registration
  ↓
Project Submission
  ↓
Judging
  ↓
Completed
```

Supported functionality includes:

- Custom judging criteria
- Team-size limits
- Registration deadlines
- Submission deadlines
- Judge assignment
- Eligibility rules
- Hackathon preview
- Student team registration
- Invitation workflows

---

## 4. Project Submission & Judging

A student team can submit:

- Project description
- Repository URL
- Demo / walkthrough URL

Judges only see hackathons to which they are assigned.

### Dynamic judging

Rubrics are stored with the hackathon rather than hard-coded into the frontend.

Example:

```text
Potion Code       9 / 10
Spell Design      8 / 10
Wand Optimization 10 / 10
-------------------------
Final Score       27 / 30
```

This allows each university hackathon to define its own evaluation criteria.

---

## 5. Admin Control Center

Administrators can:

- View platform metrics
- Search users
- Filter users
- Change roles
- Suspend / activate users
- Approve clubs
- Suspend clubs
- Publish global announcements
- Create institutional accounts
- Import accounts through CSV

### CSV provisioning

Supported account provisioning includes row-level validation for:

```text
name,email,role,universityId,department,year
```

The import process is designed to be atomic.

- MongoDB transactions are used when supported.
- A manual rollback fallback is used for standalone MongoDB environments.
- Invalid batches do not intentionally leave partially created accounts.

---

# ⚡ Performance & UX

CampusHub includes several production-oriented frontend improvements.

### Route-level code splitting

Pages are loaded using `React.lazy()` rather than shipping every page in the initial bundle.

This reduced the measured entry JavaScript bundle from approximately:

```text
Before: 478 KB
After:  303 KB
```

with page modules emitted as separate chunks.

### Other improvements

- React Error Boundary
- Loading states
- Dynamic page titles
- Accessible loading announcements
- `aria-busy` support
- Protected navigation
- Recovery UI for runtime errors

---

# 🧪 Quality Assurance

CampusHub includes a unified backend QA runner.

Run:

```bash
cd server
npm test
```

The current verification pipeline contains **13 suites**:

1. Authentication
2. Quizzes
3. Quiz Attempts
4. Clubs & Hackathons
5. Teams & Invitations
6. Submissions & Dates
7. Announcements & Feed
8. Full-Text Search
9. Professor E2E
10. Club Admin E2E
11. Submissions & Judging E2E
12. Admin Console E2E
13. Institution Authentication

Latest recorded result:

```text
Summary: 13/13 passed, 0 skipped

✅ QA PASSED SUCCESSFULLY!
```

Frontend verification:

```text
npm run lint
```

```text
0 warnings
0 errors
```

Production build:

```bash
npm run build
```

Latest recorded production build completed successfully.

---

# 📁 Project Structure

```text
CampusHub/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── config/
│   ├── constants/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   │   ├── seedAdmin.js
│   │   └── seedRealisticData.js
│   ├── utils/
│   ├── test-*.js
│   ├── run-all-tests.js
│   ├── package.json
│   └── server.js
│
├── .gitignore
├── package.json
└── README.md
```

---

# 🚀 Local Development

## Prerequisites

Install:

- Node.js
- npm
- MongoDB Community Server
- Git

For macOS with Homebrew:

```bash
brew tap mongodb/brew
brew install mongodb-community@8.0
```

Start MongoDB:

```bash
brew services start mongodb/brew/mongodb-community@8.0
```

Verify:

```bash
mongosh
```

---

## 1. Clone the repository

```bash
git clone https://github.com/ArjunReddyVelma/CampusHub.git
cd CampusHub
```

---

## 2. Install dependencies

From the project root:

```bash
npm install
```

Then:

```bash
cd server
npm install
cd ../client
npm install
cd ..
```

---

## 3. Configure environment variables

### `server/.env`

Example:

```env
NODE_ENV=development
PORT=5050

MONGODB_URI=mongodb://127.0.0.1:27017/campushub

JWT_SECRET=replace-with-a-long-random-secret

CLIENT_URL=http://localhost:5173

ALLOW_PUBLIC_REGISTRATION=false

UNIVERSITY_EMAIL_DOMAIN=campushub.test
```

### `client/.env`

Example:

```env
VITE_API_URL=http://localhost:5050/api/v1
```

> Never commit real `.env` files, database passwords, JWT secrets, or production credentials.

---

# 👤 Seed an Initial Administrator

From `server/`:

```bash
npm run seed:admin
```

The seeder reads administrator values from environment variables.

Example:

```env
ADMIN_NAME=CampusHub Administrator
ADMIN_EMAIL=admin@campushub.test
ADMIN_PASSWORD=change-this-password
```

---

# 🏫 Seed Realistic University Test Data

For local development only:

```bash
cd server
npm run seed:realistic
```

The realistic dataset contains:

- 1 Admin
- 3 Professors
- 10 Students
- 1 Club Admin
- 2 Judges

The seeder supports `SEED_PASSWORD` and intentionally refuses to run in production mode.

> Do not publish real passwords in this README or in source control.

---

# ▶️ Run CampusHub

From the root:

```bash
npm run dev
```

This starts:

```text
Backend → http://localhost:5050
Frontend → http://localhost:5173
```

Open:

```text
http://localhost:5173
```

If Vite selects another port because `5173` is already occupied, use the URL printed in the terminal.

---

# 🔎 API

The backend exposes REST endpoints under:

```text
/api/v1
```

Important endpoint groups include:

```text
/auth
/users
/admin
/clubs
/hackathons
/submissions
/quizzes
/attempts
/teams
/announcements
/dashboard
```

The backend also provides protected role-specific endpoints.

---

# 🔒 Production Deployment

Recommended production architecture:

```text
Browser
   │
   ▼
Frontend CDN / Vercel
   │
   │ HTTPS
   ▼
Express API
   │
   │ Mongoose
   ▼
MongoDB Atlas
```

Production configuration should include:

```env
NODE_ENV=production
MONGODB_URI=<mongodb-atlas-uri>
JWT_SECRET=<strong-random-secret>
CLIENT_URL=<production-frontend-origin>
VITE_API_URL=<production-api-url>
```

Production requirements:

- HTTPS everywhere
- Secure HttpOnly cookies
- Restricted CORS origin
- MongoDB Atlas or equivalent managed database
- Strong JWT secret
- No production secrets in Git
- Production logging without credentials or tokens
- Database backups
- Monitoring and health checks

---

# 🛡️ Security Design

CampusHub uses defense-in-depth:

```text
Frontend Route Guards
        +
Backend Authentication Middleware
        +
Role Authorization
        +
Resource Ownership Checks
        +
Database Validation
```

Examples verified through E2E testing:

- Students cannot access admin resources.
- Students cannot access judge submission lists.
- Unassigned judges cannot evaluate projects.
- Judges cannot evaluate submissions from unrelated hackathons.
- Club admins cannot modify another club's hackathons.
- Admins cannot remove the last active administrator.
- Suspended users cannot log in.
- Temporary-password users cannot access protected resources before changing passwords.

---

# 📊 Project Progress

| Phase | Status |
|---|---|
| Backend REST API | ✅ Complete |
| Frontend Architecture | ✅ Complete |
| Authentication UI | ✅ Complete |
| Student Workspace | ✅ Complete |
| Professor Quiz Workflow | ✅ Complete |
| Club & Hackathon Management | ✅ Complete |
| Student Submissions | ✅ Complete |
| Judge Evaluation | ✅ Complete |
| Admin Control Center | ✅ Complete |
| Performance & Accessibility | ✅ Complete |
| Full QA & Regression Testing | ✅ Complete |
| Production Configuration | ✅ Complete |
| Institution-Managed Authentication | ✅ Complete |
| Production Readiness Audit | ✅ Complete |

---

# 🗺️ Future Roadmap

Potential next improvements:

- University SSO / OAuth / SAML integration
- Email-based password reset
- Email verification
- University directory synchronization
- Attendance management
- Timetable / academic calendar
- Faculty course management
- Student ID card integration
- Advanced analytics dashboards
- Audit logs for administrative actions
- File/document management
- Cloud object storage for project submissions
- Automated CI/CD pipeline
- Docker deployment
- Production monitoring and alerting
- Automated database backups

---

# 🎯 Project Goal

CampusHub is intended to move beyond a simple student-management CRUD application.

The goal is to provide a **role-aware university digital campus platform** where:

> **Students learn and participate. Professors teach and assess. Clubs organize. Judges evaluate. Administrators govern the platform.**

The architecture is designed so additional university workflows can be added without rebuilding the authentication and authorization foundation.

---

## 👨‍💻 Author

**Arjun Reddy Velma**

CampusHub — University Digital Campus Platform

Built with the MERN stack.

---

## 📄 License

This project is currently intended as an educational / academic project.

Add an explicit open-source license before distributing the repository publicly.
