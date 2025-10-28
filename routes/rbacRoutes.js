const express = require('express');
const router = express.Router();
const authorize = require('../middleware/rbacMiddleware');
const rbacController = require('../controllers/rbacController');

// Middleware to ensure only admins can access these routes
// Assuming 'manage_organization' is a permission typically granted to admins
const adminAuthorize = authorize('manage_organization');

// Get all roles (Admin only)
router.get('/roles', adminAuthorize, rbacController.getAllRoles);

// Get all permissions (Admin only)
router.get('/permissions', adminAuthorize, rbacController.getAllPermissions);

// Get permissions for a specific role (Admin only)
router.get('/role-permissions/:roleId', adminAuthorize, rbacController.getRolePermissions);

// Update permissions for a specific role (Admin only)
router.put('/role-permissions/:roleId', adminAuthorize, rbacController.updateRolePermissions);

module.exports = router;