const mongoose = require('mongoose');

// --- COMMON STRUCTURES ---
const serviceBase = {
    customServiceId: { type: String, unique: true },
    serviceCategory: { type: String, required: true },
    packageName: { type: String, required: true },
    packageImage: { type: String },
    description: { type: String },
    priceAmount: { type: Number, required: true },
    estimatedTime: { type: String, required: true },
    inclusions: [{ type: String }], // Frontend checklist ke liye add kiya
    isServiceActive: { type: Boolean, default: true }
};

const vendorBase = {
    customUserId: { type: String, unique: true }, 
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    userFullName: { type: String }, 
    userEmail: { type: String, required: true, unique: true, lowercase: true },
    userPhone: { type: String, required: true, unique: true },
    userPassword: { type: String, required: true },
    aadharNumber: { type: String, required: true, unique: true }, 
    panNumber: { type: String, unique: true },
    vendorCategory: { type: String, required: true }, 
    vendorPhoto: { type: String }, 
    vendorStreet: { type: String },
    vendorCity: { type: String },
    vendorState: { type: String },
    vendorPincode: { type: String },
    vendorAddress: { type: String }, 
    isOnline: { type: Boolean, default: false }, 
    isVerified: { type: Boolean, default: false },
    walletBalance: { type: Number, default: 0 },
    role: { type: String, default: 'Vendor' }
};

const options = { timestamps: true };

// --- SERVICE TABLES ---
const AcService = mongoose.model('AcService', new mongoose.Schema(serviceBase, options));
const PlumbingService = mongoose.model('PlumbingService', new mongoose.Schema(serviceBase, options));
const ElectricianService = mongoose.model('ElectricianService', new mongoose.Schema(serviceBase, options));
const CarpenterService = mongoose.model('CarpenterService', new mongoose.Schema(serviceBase, options));
const RoService = mongoose.model('RoService', new mongoose.Schema(serviceBase, options));
const PestControlService = mongoose.model('PestControlService', new mongoose.Schema(serviceBase, options));
const HouseMaidService = mongoose.model('HouseMaidService', new mongoose.Schema(serviceBase, options));
const PaintingService = mongoose.model('PaintingService', new mongoose.Schema(serviceBase, options));
const SmartLockService = mongoose.model('SmartLockService', new mongoose.Schema(serviceBase, options));
const AppliancesService = mongoose.model('AppliancesService', new mongoose.Schema(serviceBase, options));

// --- VENDOR TABLES ---
const AcVendor = mongoose.model('AcVendor', new mongoose.Schema(vendorBase, options));
const PlumbingVendor = mongoose.model('PlumbingVendor', new mongoose.Schema(vendorBase, options));
const ElectricianVendor = mongoose.model('ElectricianVendor', new mongoose.Schema(vendorBase, options));
const CarpenterVendor = mongoose.model('CarpenterVendor', new mongoose.Schema(vendorBase, options));
const RoVendor = mongoose.model('RoVendor', new mongoose.Schema(vendorBase, options));
const PestControlVendor = mongoose.model('PestControlVendor', new mongoose.Schema(vendorBase, options));
const HouseMaidVendor = mongoose.model('HouseMaidVendor', new mongoose.Schema(vendorBase, options));
const PaintingVendor = mongoose.model('PaintingVendor', new mongoose.Schema(vendorBase, options));
const SmartLockVendor = mongoose.model('SmartLockVendor', new mongoose.Schema(vendorBase, options));
const AppliancesVendor = mongoose.model('AppliancesVendor', new mongoose.Schema(vendorBase, options));

// --- CORE TABLES ---
const Customer = mongoose.model('Customer', new mongoose.Schema({
    customUserId: { type: String, unique: true }, 
    userFullName: { type: String, required: true },
    userEmail: { type: String, required: true, unique: true, lowercase: true },
    userPhone: { type: String, required: true, unique: true },
    userPassword: { type: String, required: true },
    role: { type: String, default: 'Customer' }
}, options));

const Admin = mongoose.model('Admin', new mongoose.Schema({
    customUserId: { type: String, unique: true }, 
    userFullName: { type: String, required: true },
    userEmail: { type: String, required: true, unique: true, lowercase: true },
    userPassword: { type: String, required: true },
    role: { type: String, default: 'Admin' }
}, options));

const Booking = mongoose.model('Booking', new mongoose.Schema({
    customBookingId: { type: String, unique: true }, 
    customerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, 
    assignedVendorId: { type: String }, 
    vendorCategory: { type: String }, 
    serviceCategory: { type: String, required: true },
    packageName: { type: String, required: true },
    totalPrice: { type: Number, required: true },
    bookingDate: { type: String, required: true },
    bookingTime: { type: String, required: true },
    serviceAddress: { type: String, required: true },
    // --- Razorpay & Payment Updates Start ---
    paymentMethod: { type: String, default: 'COD' }, // 'COD' or 'RAZORPAY'
    transactionId: { type: String }, // Razorpay Payment ID save karne ke liye
    paymentStatus: { type: String, default: 'Pending' }, // 'Pending' or 'Paid'
    // --- Razorpay & Payment Updates End ---
    bookingStatus: { 
        type: String, 
        enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'], 
        default: 'Pending' 
    }
}, options));

// --- DYNAMIC MAPPING (Frontend categories to correct Model) ---
const ServiceModels = {
    'Split AC': AcService, 'Window AC': AcService,
    'Washing Machine': AppliancesService, 'Refrigerator': AppliancesService, 'Microwave': AppliancesService,
    'Repair': PlumbingService, 'Installation': PlumbingService,
    'General Repair': CarpenterService, 'New Assembly': CarpenterService,
    'Routine Service': RoService, 'Repair & Parts': RoService,
    'General Pest': PestControlService, 'Specialized': PestControlService,
    'One-Time': HouseMaidService, 'Subscription': HouseMaidService,
    'Full Home': PaintingService, 'Room/Wall': PaintingService,
    'Installation': SmartLockService, 'Repair & Support': SmartLockService,
    'Electrician': ElectricianService
};

const VendorModels = {
    'AC': AcVendor, 'Plumbing': PlumbingVendor, 'Electrician': ElectricianVendor,
    'Carpenter': CarpenterVendor, 'RO': RoVendor, 'PestControl': PestControlVendor,
    'HouseMaid': HouseMaidVendor, 'Painting': PaintingVendor, 'SmartLock': SmartLockVendor,
    'Appliances': AppliancesVendor
};

module.exports = { 
    Customer, Admin, Booking, ServiceModels, VendorModels,
    AcService, PlumbingService, ElectricianService, CarpenterService, RoService, 
    PestControlService, HouseMaidService, PaintingService, SmartLockService, AppliancesService,
    AcVendor, PlumbingVendor, ElectricianVendor, CarpenterVendor, RoVendor, PestControlVendor, HouseMaidVendor, PaintingVendor, SmartLockVendor, AppliancesVendor
};




































































// const mongoose = require('mongoose');

// // --- COMMON STRUCTURES ---
// const serviceBase = {
//     customServiceId: { type: String, unique: true },
//     serviceCategory: { type: String, required: true },
//     packageName: { type: String, required: true },
//     packageImage: { type: String },
//     description: { type: String },
//     priceAmount: { type: Number, required: true },
//     estimatedTime: { type: String, required: true },
//     inclusions: [{ type: String }],
//     isServiceActive: { type: Boolean, default: true }
// };

// const vendorBase = {
//     customUserId: { type: String, unique: true }, 
//     firstName: { type: String, required: true },
//     lastName: { type: String, required: true },
//     userFullName: { type: String }, 
//     userEmail: { type: String, required: true, unique: true, lowercase: true },
//     userPhone: { type: String, required: true, unique: true },
//     userPassword: { type: String, required: true },
//     aadharNumber: { type: String, required: true, unique: true }, 
//     panNumber: { type: String, unique: true },
//     vendorCategory: { type: String, required: true }, 
//     vendorPhoto: { type: String }, 
//     vendorStreet: { type: String },
//     vendorCity: { type: String },
//     vendorState: { type: String },
//     vendorPincode: { type: String },
//     vendorAddress: { type: String }, 
//     isOnline: { type: Boolean, default: false }, 
//     isVerified: { type: Boolean, default: false },
//     walletBalance: { type: Number, default: 0 },
//     role: { type: String, default: 'Vendor' }
// };

// const options = { timestamps: true };

// // --- SERVICE TABLES ---
// const AcService = mongoose.model('AcService', new mongoose.Schema(serviceBase, options));
// const PlumbingService = mongoose.model('PlumbingService', new mongoose.Schema(serviceBase, options));
// const ElectricianService = mongoose.model('ElectricianService', new mongoose.Schema(serviceBase, options));
// const CarpenterService = mongoose.model('CarpenterService', new mongoose.Schema(serviceBase, options));
// const RoService = mongoose.model('RoService', new mongoose.Schema(serviceBase, options));
// const PestControlService = mongoose.model('PestControlService', new mongoose.Schema(serviceBase, options));
// const HouseMaidService = mongoose.model('HouseMaidService', new mongoose.Schema(serviceBase, options));
// const PaintingService = mongoose.model('PaintingService', new mongoose.Schema(serviceBase, options));
// const SmartLockService = mongoose.model('SmartLockService', new mongoose.Schema(serviceBase, options));
// const AppliancesService = mongoose.model('AppliancesService', new mongoose.Schema(serviceBase, options));

// // --- VENDOR TABLES ---
// const AcVendor = mongoose.model('AcVendor', new mongoose.Schema(vendorBase, options));
// const PlumbingVendor = mongoose.model('PlumbingVendor', new mongoose.Schema(vendorBase, options));
// const ElectricianVendor = mongoose.model('ElectricianVendor', new mongoose.Schema(vendorBase, options));
// const CarpenterVendor = mongoose.model('CarpenterVendor', new mongoose.Schema(vendorBase, options));
// const RoVendor = mongoose.model('RoVendor', new mongoose.Schema(vendorBase, options));
// const PestControlVendor = mongoose.model('PestControlVendor', new mongoose.Schema(vendorBase, options));
// const HouseMaidVendor = mongoose.model('HouseMaidVendor', new mongoose.Schema(vendorBase, options));
// const PaintingVendor = mongoose.model('PaintingVendor', new mongoose.Schema(vendorBase, options));
// const SmartLockVendor = mongoose.model('SmartLockVendor', new mongoose.Schema(vendorBase, options));
// const AppliancesVendor = mongoose.model('AppliancesVendor', new mongoose.Schema(vendorBase, options));

// // --- CORE TABLES ---
// const Customer = mongoose.model('Customer', new mongoose.Schema({
//     customUserId: { type: String, unique: true }, 
//     userFullName: { type: String, required: true },
//     userEmail: { type: String, required: true, unique: true, lowercase: true },
//     userPhone: { type: String, required: true, unique: true },
//     userPassword: { type: String, required: true },
//     role: { type: String, default: 'Customer' }
// }, options));

// const Admin = mongoose.model('Admin', new mongoose.Schema({
//     customUserId: { type: String, unique: true }, 
//     userFullName: { type: String, required: true },
//     userEmail: { type: String, required: true, unique: true, lowercase: true },
//     userPassword: { type: String, required: true },
//     role: { type: String, default: 'Admin' }
// }, options));

// const Booking = mongoose.model('Booking', new mongoose.Schema({
//     customBookingId: { type: String, unique: true }, 
//     customerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, 
//     assignedVendorId: { type: String }, 
//     vendorCategory: { type: String }, 
//     serviceCategory: { type: String, required: true },
//     packageName: { type: String, required: true },
//     totalPrice: { type: Number, required: true },
//     bookingDate: { type: String, required: true },
//     bookingTime: { type: String, required: true },
//     serviceAddress: { type: String, required: true },
//     bookingStatus: { 
//         type: String, 
//         enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'], 
//         default: 'Pending' 
//     }
// }, options));

// const ServiceModels = {
//     'Split AC': AcService, 'Window AC': AcService,
//     'Washing Machine': AppliancesService, 'Refrigerator': AppliancesService, 'Microwave': AppliancesService,
//     'Repair': PlumbingService, 'Installation': PlumbingService,
//     'General Repair': CarpenterService, 'New Assembly': CarpenterService,
//     'Routine Service': RoService, 'Repair & Parts': RoService,
//     'General Pest': PestControlService, 'Specialized': PestControlService,
//     'One-Time': HouseMaidService, 'Subscription': HouseMaidService,
//     'Full Home': PaintingService, 'Room/Wall': PaintingService,
//     'Installation': SmartLockService, 'Repair & Support': SmartLockService,
//     'Electrician': ElectricianService
// };

// const VendorModels = {
//     'AC': AcVendor, 'Plumbing': PlumbingVendor, 'Electrician': ElectricianVendor,
//     'Carpenter': CarpenterVendor, 'RO': RoVendor, 'PestControl': PestControlVendor,
//     'HouseMaid': HouseMaidVendor, 'Painting': PaintingVendor, 'SmartLock': SmartLockVendor,
//     'Appliances': AppliancesVendor
// };

// module.exports = { 
//     Customer, Admin, Booking, ServiceModels, VendorModels,
//     AcService, PlumbingService, ElectricianService, CarpenterService, RoService, 
//     PestControlService, HouseMaidService, PaintingService, SmartLockService, AppliancesService,
//     AcVendor, PlumbingVendor, ElectricianVendor, CarpenterVendor, RoVendor, PestControlVendor, HouseMaidVendor, PaintingVendor, SmartLockVendor, AppliancesVendor
// };