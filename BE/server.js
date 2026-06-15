const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

// Kích hoạt kết nối MySQL
const db = require('./config/db');

// Import bộ định tuyến Auth
const authRouter = require('./routers/authRouter');

const app = express();

// Đọc dữ liệu định dạng JSON gửi lên từ Client
app.use(express.json());

// Điều hướng các API liên quan đến tài khoản
app.use('/api/auth', authRouter);

app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: "🚀 Hệ thống Backend đang hoạt động ổn định!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(`🚀 Server khởi động tại Port: ${PORT}`);
    console.log(`🔗 Link test local: http://localhost:${PORT}`);
    console.log(`=========================================\n`);
});