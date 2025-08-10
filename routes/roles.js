const express = require('express');
const Role = require('../models/Role');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all roles
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const roles = await Role.find();
    res.json({ success: true, data: roles });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch roles' });
  }
});

// Create a new role
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, key, description, permissions } = req.body;
    const role = new Role({ name, key, description, permissions });
    await role.save();
    res.json({ success: true, data: role });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create role', error: err.message });
  }
});

// Update a role
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, key, description, permissions } = req.body;
    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { name, key, description, permissions },
      { new: true }
    );
    res.json({ success: true, data: role });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update role', error: err.message });
  }
});

// Delete a role
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    await Role.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Role deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete role', error: err.message });
  }
});

module.exports = router;
