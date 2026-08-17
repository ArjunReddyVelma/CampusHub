const express = require('express');
const { evaluateProject } = require('../controllers/submissionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/:id/evaluate', authorize('judge', 'admin'), evaluateProject);

module.exports = router;
