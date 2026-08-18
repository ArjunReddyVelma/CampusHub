# CampusHub - Database Indexing & Search Design

This document describes the query indexing strategies, full-text searching mechanics, and scaling optimizations implemented in the CampusHub backend.

---

## 1. Single-Field & Compound Indexing Strategies

To prevent collection scans (`COLLSCAN`) and ensure all primary search criteria are served using index scans (`IXSCAN`), the following database indexes are registered:

### User Collection
*   `email: 1` (Unique) - Accelerates credential lookup on login.
*   `universityId: 1` (Sparse Index) - Speeds up lookup of user universityId if provisioned.
*   `employeeId: 1` (Sparse Index) - Speeds up lookup of user employeeId if provisioned.

### StudentProfile Collection
*   `universityId: 1` (Unique) - Enforces global student uniqueness and accelerates profile association checks.

### Quiz & Question Collections
*   `professor: 1` - Serves professor-specific draft and metrics dashboards.
*   `quiz: 1` - Accelerates quiz outline rendering and grading evaluations.

### QuizAttempt Collection
*   `student: 1, quiz: 1` - Serves start/resume lookups, checks student attempt quotas, and maintains user dashboard result listings.

### Club & Hackathon Collections
*   `owner: 1` - Guarantees that a user owns at most one club profile.
*   `club: 1` - Serves hackathon lookups managed by a specific club.

### Team & TeamInvitation Collections
*   `hackathon: 1, name: 1` (Unique) - Guarantees that team names are unique within a single hackathon.
*   `team: 1, invitee: 1, status: 1` - Speeds up membership checks and eliminates duplicate active invitations.

### Submission Collection
*   `team: 1` (Unique) - Restricts each team to a single submission per hackathon.
*   `hackathon: 1` - Accelerates project list fetches for judges.

---

## 2. MongoDB Full-Text Search Indices

Rather than using slow `$regex` scans which bypass Mongoose indexes and trigger severe CPU utilization spikes, we register native text indices on MongoDB:

1.  **Clubs**:
    ```javascript
    ClubSchema.index({ name: 'text', description: 'text', category: 'text' });
    ```
2.  **Hackathons**:
    ```javascript
    HackathonSchema.index({ title: 'text', description: 'text', problemStatement: 'text' });
    ```
3.  **Quizzes**:
    ```javascript
    QuizSchema.index({ title: 'text', description: 'text' });
    ```

### Search Execution
Full-text search queries use MongoDB's `$text` operator:
```javascript
if (req.query.search) {
  query.$text = { $search: req.query.search };
}
```
This is a standard production optimization that matches word stems, scores result relevance, and performs rapid indexed lookups.

---

## 3. Database Scaling Recommendations

As CampusHub scales to handle thousands of concurrent users, the following database adjustments are recommended:

*   **Sharding Key Strategy**:
    *   For the `QuizAttempt` and `Submission` collections, shard using `{ student: 'hashed' }` or `{ team: 'hashed' }` to distribute write loads evenly across shards.
*   **Read Preference Routing**:
    *   Set read preferences to `secondaryPreferred` for analytical tasks, dashboard statistics compilations, and global announcements reads. This directs read operations to replication replicas and saves the primary shard for transactional operations (submitting answers, creating teams).
*   **Index Re-indexing schedule**:
    *   Schedule periodic re-indexing using a Cron scheduler during low-traffic windows to reduce fragmentation of text indexes.
