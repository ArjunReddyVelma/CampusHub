const express = require('express');
const { 
  getAdminDashboard, 
  getUsers, 
  updateUserRole, 
  toggleUserStatus,
  createUser,
  importUsers
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getAdminDashboard);
router.get('/users', getUsers);
router.post('/users', createUser);
router.post('/users/import', importUsers);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', toggleUserStatus);

module.exports = router;
