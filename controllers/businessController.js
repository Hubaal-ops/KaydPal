const Business = require('../models/Business');

/*
 * Business API Endpoints:
 * GET /api/business - Get business information for the current user
 * POST /api/business - Create or update business information
 * PUT /api/business - Update business information
 */

// Get business information for the current user
exports.getBusinessInfo = async (req, res) => {
  try {
    const business = await Business.findOne({ userId: req.user.id });
    
    if (!business) {
      return res.status(404).json({ 
        success: false, 
        message: 'Business information not found' 
      });
    }
    
    res.json({
      success: true,
      data: business
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch business information',
      details: err.message 
    });
  }
};

// Create business information for the current user
exports.createBusinessInfo = async (req, res) => {
  try {
    // Check if business already exists for this user
    const existingBusiness = await Business.findOne({ userId: req.user.id });
    
    if (existingBusiness) {
      return res.status(400).json({ 
        success: false, 
        message: 'Business information already exists. Use PUT to update.' 
      });
    }
    
    const businessData = {
      ...req.body,
      userId: req.user.id
    };
    
    const business = new Business(businessData);
    await business.save();
    
    res.status(201).json({
      success: true,
      message: 'Business information created successfully',
      data: business
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to create business information',
      details: err.message 
    });
  }
};

// Update business information for the current user
exports.updateBusinessInfo = async (req, res) => {
  try {
    const business = await Business.findOne({ userId: req.user.id });
    
    if (!business) {
      // If no business exists, create one
      const businessData = {
        ...req.body,
        userId: req.user.id
      };
      
      const newBusiness = new Business(businessData);
      await newBusiness.save();
      
      return res.json({
        success: true,
        message: 'Business information created successfully',
        data: newBusiness
      });
    }
    
    // Update existing business
    Object.keys(req.body).forEach(key => {
      if (key !== 'userId') { // Don't allow userId to be changed
        business[key] = req.body[key];
      }
    });
    
    await business.save();
    
    res.json({
      success: true,
      message: 'Business information updated successfully',
      data: business
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to update business information',
      details: err.message 
    });
  }
};