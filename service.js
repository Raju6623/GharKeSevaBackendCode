const { Customer, VendorModels, Admin, ServiceModels, Booking } = require('./schema');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Razorpay = require('razorpay');

// --- 1. RAZORPAY SETUP ---
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- 2. NODEMAILER SETUP ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS  // Ensure this is a 16-digit App Password
    }
});

// --- 3. HELPER FUNCTIONS ---
const getServiceModel = (cat) => ServiceModels[cat] || ServiceModels['Split AC'];
const getVendorModel = (cat) => VendorModels[cat] || VendorModels['AC'];

const generateUniqueId = (model, prefix) => {
    return model.countDocuments()
        .then(count => {
            const sequence = 1000 + count + 1;
            return `${prefix}-${sequence}`;
        });
};

// --- 4. EMAIL TEMPLATE FUNCTION ---
const sendBookingEmail = async (userEmail, bookingDetails) => {
    const mailOptions = {
        from: `"GharKeSeva" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `Booking Confirmed: ${bookingDetails.customBookingId}`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 15px;">
                <h2 style="color: #2563eb;">Order Confirmed! ✅</h2>
                <p>Hello, aapka order successfully place ho gaya hai.</p>
                <div style="background: #f8fafc; padding: 15px; border-radius: 10px; margin: 10px 0;">
                    <p><strong>Booking ID:</strong> ${bookingDetails.customBookingId}</p>
                    <p><strong>Service:</strong> ${bookingDetails.packageName}</p>
                    <p><strong>Total Paid:</strong> ₹${bookingDetails.totalPrice}</p>
                    <p><strong>Address:</strong> ${bookingDetails.serviceAddress}</p>
                </div>
                <p>Professional jald hi pahunch jayega.</p>
                <p style="font-size: 12px; color: #94a3b8;">GharKeSeva - Bihar's Trusted Network</p>
            </div>
        `
    };
    return transporter.sendMail(mailOptions);
};

// --- 5. CORE LOGIC FUNCTIONS ---

const fetchServicesByFilter = async (category) => {
    if (!category) return [];
    const Model = getServiceModel(category);
    return Model.find({ serviceCategory: category, isServiceActive: true }).sort({ createdAt: -1 });
};

const addNewServicePackage = async (serviceData) => {
    const Model = getServiceModel(serviceData.serviceCategory);
    const newId = await generateUniqueId(Model, 'SRV');
    let inclusionList = serviceData['inclusions[]'] || serviceData.inclusions || [];
    if (typeof inclusionList === 'string') inclusionList = [inclusionList];

    return new Model({ 
        ...serviceData, 
        inclusions: inclusionList,
        customServiceId: newId 
    }).save();
};

const registerNewUserAccount = (userData) => {
    if (!userData.userPassword) return Promise.reject(new Error('Password is required'));
    return Customer.findOne({ userEmail: userData.userEmail })
        .then(existingUser => {
            if (existingUser) throw new Error('Customer already exists');
            return Promise.all([bcrypt.hash(userData.userPassword, 10), generateUniqueId(Customer, 'CUST')]);
        })
        .then(([hashedPassword, newUserId]) => {
            return Customer.create({ ...userData, userPassword: hashedPassword, customUserId: newUserId, role: 'Customer' });
        });
};

const loginToUserAccount = (email, password) => {
    let foundUser;
    if (!email || !password) return Promise.reject(new Error('Email and Password are required'));
    return Customer.findOne({ userEmail: email })
        .then(user => {
            if (!user) throw new Error('Customer not found');
            foundUser = user;
            return bcrypt.compare(password, user.userPassword);
        })
        .then(isMatch => {
            if (!isMatch) throw new Error('Invalid Credentials');
            const accessToken = jwt.sign({ id: foundUser._id, role: 'Customer' }, process.env.JWT_SECRET, { expiresIn: '24h' });
            return { token: accessToken, user: { id: foundUser.customUserId, _id: foundUser._id, name: foundUser.userFullName, email: foundUser.userEmail, role: 'Customer' } };
        });
};

const registerVendorAccount = (vendorData) => {
    const Model = getVendorModel(vendorData.vendorCategory);
    return Model.findOne({ $or: [{ userEmail: vendorData.userEmail }, { aadharNumber: vendorData.aadharNumber }] })
        .then(existing => {
            if (existing) throw new Error('Vendor already exists');
            return Promise.all([bcrypt.hash(vendorData.userPassword, 10), generateUniqueId(Model, 'VND')]);
        })
        .then(([hashedPassword, newVndId]) => {
            const fullName = `${vendorData.firstName} ${vendorData.lastName}`;
            const fullAddress = `${vendorData.vendorStreet}, ${vendorData.vendorCity}, ${vendorData.vendorState} - ${vendorData.vendorPincode}`;
            return Model.create({ 
                ...vendorData, 
                userFullName: fullName,
                vendorAddress: fullAddress,
                userPassword: hashedPassword, 
                customUserId: newVndId, 
                role: 'Vendor', 
                isOnline: false,
                walletBalance: 0 
            });
        });
};

const loginToVendorAccount = async (email, password) => {
    let foundVendor = null;
    let TargetModel = null;
    for (let cat in VendorModels) {
        const vendor = await VendorModels[cat].findOne({ userEmail: email });
        if (vendor) { foundVendor = vendor; TargetModel = VendorModels[cat]; break; }
    }
    if (!foundVendor) throw new Error('Vendor account not found');
    const isMatch = await bcrypt.compare(password, foundVendor.userPassword);
    if (!isMatch) throw new Error('Invalid Credentials');
    const updatedVendor = await TargetModel.findByIdAndUpdate(foundVendor._id, { isOnline: true }, { new: true });
    const accessToken = jwt.sign({ id: updatedVendor._id, role: 'Vendor', category: updatedVendor.vendorCategory }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return { token: accessToken, user: { id: updatedVendor.customUserId, _id: updatedVendor._id, name: updatedVendor.userFullName, role: 'Vendor', isOnline: updatedVendor.isOnline, category: updatedVendor.vendorCategory } };
};

const registerAdminAccount = (adminData) => {
    return Admin.findOne({ userEmail: adminData.userEmail })
        .then(existing => {
            if (existing) throw new Error('Admin exists');
            return Promise.all([bcrypt.hash(adminData.userPassword, 10), generateUniqueId(Admin, 'ADM')]);
        }).then(([hashedPassword, newAdmId]) => {
            return Admin.create({ ...adminData, userPassword: hashedPassword, customUserId: newAdmId, role: 'Admin' });
        });
};

const loginToAdminAccount = (email, password) => {
    let foundAdmin;
    return Admin.findOne({ userEmail: email })
        .then(admin => {
            if (!admin) throw new Error('Admin access denied');
            foundAdmin = admin;
            return bcrypt.compare(password, admin.userPassword);
        })
        .then(isMatch => {
            if (!isMatch) throw new Error('Invalid Credentials');
            const accessToken = jwt.sign({ id: foundAdmin._id, role: 'Admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
            return { token: accessToken, user: { id: foundAdmin.customUserId, name: foundAdmin.userFullName, role: 'Admin' } };
        });
};

// --- UPDATED CREATE BOOKING (Email integration) ---
const createNewBookingEntry = async (bookingData) => {
    const newBookingId = await generateUniqueId(Booking, 'GS');
    const booking = await new Booking({ ...bookingData, customBookingId: newBookingId }).save();
    
    // Auto-fetch Customer and Send Mail
    try {
        const customer = await Customer.findById(bookingData.customerUserId);
        if (customer && customer.userEmail) {
            await sendBookingEmail(customer.userEmail, booking);
        }
    } catch (err) {
        console.error("Email Error:", err.message);
    }
    return booking;
};

const calculateAdminDashboardStats = () => {
    return Booking.find().then(async (allBookings) => {
        const revenue = allBookings.filter(b => b.bookingStatus === 'Completed').reduce((sum, b) => sum + b.totalPrice, 0);
        let totalVendors = 0;
        for(let cat in VendorModels) { totalVendors += await VendorModels[cat].countDocuments({ isVerified: true }); }
        return Promise.all([revenue, Booking.countDocuments({ bookingStatus: { $ne: 'Cancelled' } }), Customer.countDocuments(), totalVendors, Booking.find().sort({ createdAt: -1 }).limit(10).populate('customerUserId', 'userFullName')]);
    }).then(([revenue, active, customers, verifiedTechs, recent]) => ({ totalRevenue: `₹${revenue.toLocaleString()}`, activeBookingsCount: active, totalUsersCount: customers, verifiedTechsCount: verifiedTechs, recentBookingsList: recent }));
};

const fetchJobsForVendor = (vendorId) => {
    return Booking.find({ 
        $or: [
            { assignedVendorId: vendorId, bookingStatus: { $ne: 'Completed' } }, 
            { assignedVendorId: null, bookingStatus: 'Pending' }
        ] 
    }).sort({ createdAt: -1 });
};

const updateBookingStatusByVendor = (bookingId, updateData) => {
    return Booking.findOneAndUpdate({ customBookingId: bookingId }, { $set: updateData }, { new: true })
        .then(async (updatedBooking) => {
            if(updatedBooking.bookingStatus === 'Completed' && updatedBooking.assignedVendorId) {
                for(let cat in VendorModels) {
                    await VendorModels[cat].findOneAndUpdate({ customUserId: updatedBooking.assignedVendorId }, { $inc: { walletBalance: updatedBooking.totalPrice } });
                }
            }
            return updatedBooking;
        });
};

const fetchFullVendorProfile = async (vendorId) => {
    for(let cat in VendorModels) {
        const vendor = await VendorModels[cat].findOne({ customUserId: vendorId }).select('-userPassword');
        if(vendor) return vendor;
    }
    return null;
};

const fetchVendorWorkHistory = (vendorId) => {
    return Booking.find({ assignedVendorId: vendorId, bookingStatus: 'Completed' }).sort({ updatedAt: -1 });
};

// --- RAZORPAY ORDER GENERATION ---
const createRazorpayOrder = async (amount) => {
    const options = {
        amount: amount * 100, // Paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
    };
    return razorpayInstance.orders.create(options);
};


const fetchUserBookings = (userId) => {
    return Booking.find({ customerUserId: userId }).sort({ createdAt: -1 });
};


// --- EXPORTS ---
module.exports = {
    registerNewUserAccount, 
    loginToUserAccount, 
    registerVendorAccount, 
    loginToVendorAccount, 
    fetchFullVendorProfile,
    fetchVendorWorkHistory, 
    registerAdminAccount, 
    loginToAdminAccount, 
    addNewServicePackage, 
    fetchServicesByFilter,
    createNewBookingEntry, 
    calculateAdminDashboardStats, 
    fetchJobsForVendor, 
    updateBookingStatusByVendor,
    createRazorpayOrder,
    sendBookingEmail,
    fetchUserBookings

};

















































































