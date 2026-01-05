const { VendorModels } = require('./schema');
const serviceLogic = require('./service');

// CUSTOMER
const handleUserRegistration = (req, res) => {
    serviceLogic.registerNewUserAccount(req.body)
        .then(data => res.status(201).json({ success: true, userId: data.customUserId }))
        .catch(err => res.status(400).json({ success: false, message: err.message }));
};

const handleUserLogin = (req, res) => {
    serviceLogic.loginToUserAccount(req.body.userEmail, req.body.userPassword)
        .then(data => res.status(200).json({ success: true, ...data }))
        .catch(err => res.status(401).json({ success: false, message: err.message }));
};

// VENDOR
const handleVendorRegistration = (req, res) => {
    const vendorData = {
        ...req.body,
        vendorPhoto: req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : null
    };
    serviceLogic.registerVendorAccount(vendorData)
        .then(data => res.status(201).json({ success: true, vendorId: data.customUserId }))
        .catch(err => res.status(400).json({ success: false, message: err.message }));
};

const handleVendorLogin = (req, res) => {
    serviceLogic.loginToVendorAccount(req.body.userEmail, req.body.userPassword)
        .then(async (data) => {
            const io = req.app.get('socketio');
            if (io) io.emit('vendor_status_change', { vendorId: data.user.id, status: true });
            res.status(200).json({ success: true, ...data });
        })
        .catch(err => res.status(401).json({ success: false, message: err.message }));
};

const handleVendorLogout = async (req, res) => {
    const { vendorId } = req.body;
    try {
        // Find vendor in all tables to set offline
        for(let cat in VendorModels) {
            await VendorModels[cat].findOneAndUpdate({ customUserId: vendorId }, { isOnline: false });
        }
        const io = req.app.get('socketio');
        if (io) io.emit('vendor_status_change', { vendorId: vendorId, status: false });
        res.status(200).json({ success: true, message: "Vendor is now Offline" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const handleFetchAllVendors = async (req, res) => {
    try {
        let allVendors = [];
        for(let cat in VendorModels) {
            const vendors = await VendorModels[cat].find();
            allVendors = [...allVendors, ...vendors];
        }
        res.status(200).json(allVendors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ADMIN
const handleAdminRegistration = (req, res) => {
    serviceLogic.registerAdminAccount(req.body)
        .then(data => res.status(201).json({ success: true, adminId: data.customUserId }))
        .catch(err => res.status(400).json({ success: false, message: err.message }));
};

const handleAdminLogin = (req, res) => {
    serviceLogic.loginToAdminAccount(req.body.userEmail, req.body.userPassword)
        .then(data => res.status(200).json({ success: true, ...data }))
        .catch(err => res.status(401).json({ success: false, message: err.message }));
};

// SERVICES & BOOKINGS
const handleCreateService = (req, res) => {
    const imageUrl = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : null;
    const serviceData = { ...req.body, packageImage: imageUrl };
    serviceLogic.addNewServicePackage(serviceData)
        .then(data => res.status(201).json({ success: true, serviceId: data.customServiceId }))
        .catch(err => res.status(400).json({ error: err.message }));
};

const handleFetchServices = (req, res) => {
    serviceLogic.fetchServicesByFilter(req.query.category)
        .then(data => res.status(200).json(data))
        .catch(err => res.status(500).json({ error: err.message }));
};

const handleCreateBooking = (req, res) => {
    serviceLogic.createNewBookingEntry(req.body)
        .then(data => {
            const io = req.app.get('socketio'); 
            if (io) io.emit('new_booking_alert', { message: `New Request!`, bookingDetails: data });
            res.status(201).json({ success: true, bookingId: data.customBookingId });
        })
        .catch(err => res.status(400).json({ error: err.message }));
};

const handleGetAdminStats = (req, res) => {
    serviceLogic.calculateAdminDashboardStats()
        .then(data => res.status(200).json({ success: true, data }))
        .catch(err => res.status(500).json({ error: err.message }));
};

const handleFetchVendorJobs = (req, res) => {
    serviceLogic.fetchJobsForVendor(req.params.vendorId)
        .then(data => res.status(200).json(data))
        .catch(err => res.status(500).json({ error: err.message }));
};

const handleVendorUpdateAction = (req, res) => {
    serviceLogic.updateBookingStatusByVendor(req.params.bookingId, req.body)
        .then(data => res.status(200).json({ success: true, data }))
        .catch(err => res.status(400).json({ success: false, error: err.message }));
};

const handleFetchFullVendorProfile = (req, res) => {
    serviceLogic.fetchFullVendorProfile(req.params.vendorId)
        .then(data => res.status(200).json(data))
        .catch(err => res.status(500).json({ error: err.message }));
};

const handleFetchVendorHistory = (req, res) => {
    serviceLogic.fetchVendorWorkHistory(req.params.vendorId)
        .then(data => res.status(200).json(data))
        .catch(err => res.status(500).json({ error: err.message }));
};



const handleCreateRazorpayOrder = (req, res) => {
    serviceLogic.createRazorpayOrder(req.body.amount)
        .then(order => res.status(200).json(order))
        .catch(err => res.status(500).json({ error: err.message }));
};



const handleFetchUserBookings = (req, res) => {
    serviceLogic.fetchUserBookings(req.params.userId)
        .then(data => res.status(200).json(data))
        .catch(err => res.status(500).json({ error: err.message }));
};




module.exports = {
    handleUserRegistration, handleUserLogin, 
    handleCreateBooking, 
    handleGetAdminStats,
    handleCreateRazorpayOrder,
    handleFetchAllVendors,
    handleVendorRegistration, handleVendorLogin, handleVendorLogout,
    handleAdminRegistration, handleAdminLogin, handleCreateService, 
    handleFetchServices, handleCreateBooking, handleGetAdminStats, 
    handleFetchVendorJobs, handleVendorUpdateAction, handleFetchFullVendorProfile,
    handleFetchVendorHistory,handleFetchUserBookings
};




































