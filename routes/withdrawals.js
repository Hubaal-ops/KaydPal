const express = require('express');
const multer = require('multer');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const { verifyToken } = require('../middleware/auth');

// Configure multer for file uploads
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
	fileFilter: (req, file, cb) => {
		if (
			file.mimetype === 'application/vnd.ms-excel' ||
			file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
			file.mimetype === 'text/csv' ||
			file.originalname.match(/\.(xlsx|xls|csv)$/i)
		) {
			cb(null, true);
		} else {
			cb(new Error('Only Excel and CSV files are allowed'));
		}
	}
});

// Get all withdrawals
router.get('/', verifyToken, withdrawalController.getAllWithdrawals);

// Get withdrawal by ID
router.get('/:id', verifyToken, withdrawalController.getWithdrawalById);

// Create new withdrawal
router.post('/', verifyToken, withdrawalController.createWithdrawal);

// Update withdrawal
router.put('/:id', verifyToken, withdrawalController.updateWithdrawal);

// Delete withdrawal
router.delete('/:id', verifyToken, withdrawalController.deleteWithdrawal);

// Download withdrawal import template
router.get('/import/template', verifyToken, withdrawalController.downloadWithdrawalTemplate);

// Import withdrawals from file
router.post('/import', verifyToken, upload.single('file'), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({
				success: false,
				message: 'No file uploaded. Please select a file to import.'
			});
		}
		const result = await withdrawalController.importWithdrawals(req.file, {
			userId: req.user.id
		});
		const response = {
			success: true,
			data: {
				importedCount: result.importedCount || 0,
				skippedCount: result.skippedCount || 0,
				totalCount: (result.importedCount || 0) + (result.skippedCount || 0),
				errors: result.errors || [],
				hasErrors: result.errors && result.errors.length > 0,
				message: result.message || 'Import completed successfully'
			}
		};
		if (response.data.importedCount === 0 && response.data.errors.length === 0) {
			response.data.message = 'No valid withdrawals found in the file. Please check the file format and try again.';
		} else if (response.data.importedCount === 0 && response.data.errors.length > 0) {
			response.data.message = 'Import completed with errors. No valid withdrawals were imported.';
		}
		res.json(response);
	} catch (error) {
		if (error.code === 'LIMIT_FILE_SIZE') {
			return res.status(400).json({
				success: false,
				message: 'File too large. Maximum size is 5MB.'
			});
		}
		if (error.message.includes('file format') || error.message.includes('invalid')) {
			return res.status(400).json({
				success: false,
				message: error.message || 'Invalid file format. Please upload a valid Excel or CSV file.'
			});
		}
		res.status(500).json({
			success: false,
			message: error.message || 'An error occurred while processing the file',
			...(process.env.NODE_ENV === 'development' && { error: error.stack })
		});
	}
});

// Export withdrawals
router.get('/export/:format?', verifyToken, async (req, res) => {
	try {
		const format = (req.params.format || 'xlsx').toLowerCase();
		if (!['xlsx', 'csv'].includes(format)) {
			return res.status(400).json({ error: 'Invalid export format. Use xlsx or csv.' });
		}
		const { buffer, mimeType, fileExtension } = await withdrawalController.exportWithdrawals(req.user.id, format);
		res.setHeader('Content-Type', mimeType);
		res.setHeader('Content-Disposition', `attachment; filename=withdrawals_${new Date().toISOString().split('T')[0]}.${fileExtension}`);
		res.send(buffer);
	} catch (error) {
		res.status(500).json({ error: error.message || 'Failed to export withdrawals' });
	}
});

module.exports = router;