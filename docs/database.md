# CampusHub Database Design

This document covers the Mongoose schemas, relationships, indexing strategies, and database validations.

## 1. Schema Specifications
For complete details of Mongoose fields, see [implementation_plan.md](file:///Users/reddy/.gemini/antigravity/brain/695b368a-8a5c-499b-b911-8ff60488c1d0/implementation_plan.md).

## 2. Uniqueness Constraints & Indices
*   `User.email`: Unique, indexed for O(1) query lookups during authorization.
*   `StudentProfile.universityId`: Unique index preventing duplicate profile records.
*   `Submission (hackathon + team)`: Compound unique index. Ensures one active project submission per team per hackathon.
*   `QuizAttempt (student + quiz + attemptCount)`: Composite rules to enforce attempt count boundaries.

## 3. Safe Question DTO Handling
*   **Security Principle**: Correct answers must never be sent to students during active quiz attempts.
*   **Implementation**: Question models contain `correctAnswers`. During fetch endpoints for students, the backend filters the MongoDB results and projects only `{ _id, type, text, options, marks }`, excluding the answer indices.
