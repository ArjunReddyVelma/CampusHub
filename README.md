# CampusHub - University Digital Activity & Assessment Platform

CampusHub is a university campus platform designed to transition from a public-registration application to an institution-managed academic system. It allows administrators to securely provision student, professor, judge, club admin, and administrator accounts, enforcing password changes on first login and providing sandboxed dashboards matching role privileges.

---

## 🛠 Technology Stack
*   **Frontend**: React (Vite SPA), Tailwind CSS, Axios, React Router.
*   **Backend**: Node.js, Express.js REST API.
*   **Database**: MongoDB, Mongoose ODM.
*   **Security**: HttpOnly authentication cookies, CORS credential constraints, helmet security headers.

---

## 🏗 System Architecture & Roles

CampusHub is built around 5 distinct roles:
1.  **Student**: Takes quizzes, forms hackathon teams, invites partners, and submits projects.
2.  **Professor**: Manages quizzes, writes questions, publishes evaluations, and views attempts.
3.  **Club Admin**: Manages university clubs, creates hackathons, and manages club rosters.
4.  **Judge**: Evaluates assigned project submissions using dynamic criteria rubrics.
5.  **Admin**: Moderate accounts, provision rosters (manually or via CSV), and post global feed announcements.

---

## ⚙️ Environment Variables

### Backend (`server/.env`)
Create a `.env` file in the `/server` directory:
```env
PORT=5050
MONGODB_URI=mongodb://127.0.0.1:27017/campushub
JWT_SECRET=super_secret_campushub_jwt_token_encryption_key_2026
CLIENT_URL=http://localhost:5173
NODE_ENV=development
ALLOW_PUBLIC_REGISTRATION=false
UNIVERSITY_EMAIL_DOMAIN=campushub.edu

# Setup default bootstrap administrator
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@campushub.edu
ADMIN_PASSWORD=AdminSecurePassword123!
```

### Frontend (`client/.env`)
Create a `.env` file in the `/client` directory:
```env
VITE_API_URL=http://localhost:5050/api/v1
```

---

## 🚀 Setup & Execution Guidelines

### 1. Install Dependencies
Run from the root repository:
```bash
npm run install:all
```

### 2. Bootstrapping Administrators (CLI)
Seed the initial system administrator using the credentials configured in your `server/.env`:
```bash
cd server
npm run seed:admin
```

### 3. Seeding Realistic University Data (CLI)
Seed 17 mock accounts (1 Admin, 3 Professors, 10 Students, 1 Club Admin, 2 Judges) with `@campushub.test` email extensions for staging and demo verification:
```bash
cd server
npm run seed:realistic
```
*Note: Seeding is blocked when `NODE_ENV=production` for database safety.*

### 4. Running the Development Servers
Start both backend and frontend dev servers concurrently:
```bash
# From root directory
npm run dev
```
*   **React Frontend (Vite)**: http://localhost:5173
*   **Express Backend**: http://localhost:5050

---

## 🧪 Testing System Suites

### Backend QA Regression & Atomicity Tests
Execute the master sequential test runner (covering auth, quizzes, attempts, clubs, submissions, full-text search, and the transactional CSV provisioning tests):
```bash
cd server
npm test
```

### Frontend Lint and Build Verification
Verify client code quality audits and production builds:
```bash
cd client
npm run lint
npm run build
```

---

## 📄 Production Deployment Notes
*   Ensure `ALLOW_PUBLIC_REGISTRATION=false` is set in production.
*   Setup CORS with the exact frontend production origin (never use `*` with credentials).
*   Production authentication cookies will automatically enable the `Secure` flag and strict same-site controls.