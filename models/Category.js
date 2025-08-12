const { ObjectId } = require('mongodb');

// Add userId to category schema for multi-tenancy
// This is a MongoDB collection, so we just need to ensure userId is set and filtered in controller logic.
// No schema file needed for plain MongoDB collections.

// This file is a placeholder to indicate that categories should have a userId field.
// The actual enforcement is in the controller.

module.exports = {};
