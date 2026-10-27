const express = require('express');
const router = express.Router();
const { downloadInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/:id', protect, downloadInvoice);

module.exports = router;