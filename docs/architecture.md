# CampusHub Architecture

This document describes the high-level architecture of CampusHub, a centralized University Digital Activity & Assessment Platform.

## 1. System Overview

CampusHub is designed as a **Modular Monolith** containing:
1.  **Frontend (`/client`)**: React Single Page Application (SPA) powered by Vite and styled with Tailwind CSS.
2.  **Backend (`/server`)**: Node.js and Express.js REST API.
3.  **Database**: MongoDB database managed via Mongoose ODM.

```text
+-----------------------------+
|        React Client         |  (Vite, Tailwind, Axios)
+-----------------------------+
               |
         HTTP  |  REST API / HttpOnly Cookie Auth
               v
+-----------------------------+
|     Express Server API      |  (Modular Routes, Services)
+-----------------------------+
               |
  Mongoose ODM |
               v
+-----------------------------+
|        MongoDB Host         |  (Atlas/Local Persistent Store)
+-----------------------------+
```

## 2. Server Module Layout

To achieve separation of concerns and allow future extraction to microservices if ever required, we use the following architectural pattern:

*   **Route**: Handlers mapping HTTP methods and endpoints.
*   **Controller**: Orchestrators validating input schemas and translating HTTP requests into service parameters.
*   **Service**: Rich domain-specific models containing all the core business logic (e.g., scoring logic, invitation logic, deadline assertions).
*   **Model**: Schemas expressing document properties and relational integrity.

## 3. Communication Patterns

*   All client-server traffic is conducted using JSON formatted HTTP REST APIs under `/api/v1/*`.
*   Authentication tokens (JWTs) are exchanged securely via HttpOnly, SameSite, and Secure cookies.
*   Real-time notifications (e.g., via Socket.IO) are planned as an advanced extension to be integrated once the core database notification layer is stabilized.
