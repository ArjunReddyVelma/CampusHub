const express = require('express');
const { evaluateProject, getSubmission } = require('../controllers/submissionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/:id', authorize('judge', 'admin', 'club_admin'), getSubmission);
router.post('/:id/evaluate', authorize('judge', 'admin'), evaluateProject);

module.exports = router;
