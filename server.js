require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const apiRouter = require('./router');
const path = require('path');
const fs = require('fs');
const { VendorModels } = require('./schema');

const app = express();
const server = http.createServer(app);

// 1. Uploads folder setup
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 2. Socket.io Config
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT"]
    }
});

app.use(cors());
app.use(express.json());

// 3. Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. Global Socket share
app.set('socketio', io);

// 5. Socket Logic (Chat + Status + Rooms)
io.on('connection', (socket) => {
    console.log('User Connected:', socket.id);

    // Join Private Room (For Chat/Notifications)
    socket.on('join_room', (userId) => {
        if (userId) {
            socket.join(userId);
            console.log(`Room Joined: ${userId}`);
        }
    });

    // Vendor Online Logic
    socket.on('join_vendor', (id) => {
        if (id) {
            socket.vendorId = id;
            socket.join(id);
            console.log(`Vendor Online: ${id}`);
        }
    });

    // Live Chat Message
    socket.on('send_message', (data) => {
        const { receiverId, message, senderName, senderId } = data;
        io.to(receiverId).emit('receive_message', {
            senderId,
            senderName,
            message,
            timestamp: new Date()
        });
    });

    // Status Alert
    socket.on('status_change_alert', (data) => {
        if (data.customerId) {
            io.to(data.customerId).emit('order_status_updated', data);
        }
    });

    // Disconnect Logic
    socket.on('disconnect', async () => {
        if (socket.vendorId) {
            try {
                for (let key in VendorModels) {
                    await VendorModels[key].findOneAndUpdate(
                        { customUserId: socket.vendorId },
                        { isOnline: false }
                    );
                }
                io.emit('vendor_status_change', { vendorId: socket.vendorId, status: false });
                console.log(`Vendor Offline: ${socket.vendorId}`);
            } catch (err) {
                console.error("Socket Error:", err);
            }
        }
    });
});

// 6. Routes
app.use('/api/auth', apiRouter);

// 7. DB Connection & Start
const PORT = process.env.PORT || 3001;
mongoose.connect(process.env.MONGO_DB)
    .then(() => {
        console.log('✅ Connected to MongoDB Atlas');
        server.listen(PORT, () => console.log(`🚀 Server on: http://localhost:${PORT}`));
    })
    .catch(err => console.error('❌ MongoDB Error:', err));