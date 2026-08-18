# CampusHub Security Design

CampusHub treats security as a first-class citizen. Below are the implementations built to prevent malicious attempts:

## 1. Authentication
*   **Password Hashing**: Done using `bcryptjs` (salt rounds: 10) during database pre-save middleware.
*   **JWT Handover**: JSON Web Tokens are stored inside `HttpOnly`, `SameSite` cookies to mitigate Cross-Site Scripting (XSS) extraction risks.

## 2. Authorization
*   **Role-Based Access Control (RBAC)**: Custom routing protection middleware checks current session properties against allowed enums (`student`, `professor`, `club_admin`, `judge`, `admin`).
*   **Data Ownership Checks**: Every patch/delete request verifies resource ownership via request parameters compared against `req.user._id` (e.g. validating that a professor owns the specific quiz they edit).

## 3. Input Validation
*   All backend API request payloads are processed against strict validators to block MongoDB Query Injection and cross-site scripting inputs.

## 4. Assessment Integrity
*   **Server-Side Evaluator**: Scoring math, time limits, and attempt bounds are computed and asserted by the server. The client cannot send calculations directly.
*   **Cheating Detection**: Warnings are generated server-side when tab/window focus changes are detected on the client.

## 5. Institution-Managed Accounts
*   **Disabled Public Registration**: The `POST /api/v1/auth/register` public endpoint is disabled by default (returning 403 Forbidden).
*   **Admin-Only Provisioning**: Only authenticated administrators can provision student, professor, club admin, judge, or admin accounts.
*   **Forced Password Change**: Provisioned users are flag-marked with `mustChangePassword = true` and blocked from accessing secure dashboards or backend application routes until they update their temporary password.
*   **Secure Admin Bootstrapping**: Initial system administrator is created via `server/scripts/seedAdmin.js` using environment variables.
*   **Email Domain Restrictions**: If `UNIVERSITY_EMAIL_DOMAIN` is set, only emails matching that domain are permitted during account provisioning.
