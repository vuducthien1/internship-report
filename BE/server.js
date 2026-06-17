const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // [1] Import thư viện cors

dotenv.config();

const db = require('./config/db');
const authRouter = require('./routers/authRouter');

const app = express();

// [2] MỞ CỬA CHO FRONTEND GỌI SANG (Phải đặt trước express.json và routes)
app.use(cors()); 

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