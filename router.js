const express = require('express');
const router = express.Router();
const controller = require("./controller");
const multer = require('multer');
const path = require('path');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => { 
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => { 
        cb(null, Date.now() + '-' + file.originalname); 
    }
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

// --- AUTH & ACCOUNT ROUTES ---
router.post('/register', controller.handleUserRegistration);
router.post('/login', controller.handleUserLogin);
router.post('/admin/register', controller.handleAdminRegistration);
router.post('/admin/login', controller.handleAdminLogin);

// --- VENDOR ROUTES ---
router.post('/vendor/register', upload.single('vendorPhoto'), controller.handleVendorRegistration);
router.post('/vendor/login', controller.handleVendorLogin); 
router.post('/vendor/logout', controller.handleVendorLogout);
router.get('/vendor/jobs/:vendorId', controller.handleFetchVendorJobs);
router.put('/vendor/update-job/:bookingId', controller.handleVendorUpdateAction);
router.get('/vendor/profile/:vendorId', controller.handleFetchFullVendorProfile);
router.get('/vendor/history/:vendorId', controller.handleFetchVendorHistory);

// --- ADMIN MANAGEMENT ROUTES ---
router.get('/admin/vendors', controller.handleFetchAllVendors);
router.get('/admin/stats', controller.handleGetAdminStats);

// --- SERVICE & BOOKING ROUTES ---
router.get('/services', controller.handleFetchServices);

// FIXED: This route now correctly handles 'packageImage' from frontend
router.post('/admin/services/add', upload.single('packageImage'), controller.handleCreateService);

router.post('/bookings/create', controller.handleCreateBooking);

// --- PAYMENT ROUTES ---
router.post('/payments/create-order', controller.handleCreateRazorpayOrder);

router.get('/bookings/user/:userId', controller.handleFetchUserBookings);

module.exports = router;

























