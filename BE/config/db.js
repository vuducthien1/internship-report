const mysql = require('mysql2');
const dotenv = require('dotenv');

// Nạp các biến môi trường từ file .env
dotenv.config();

// Tạo một Connection Pool để kết nối an toàn và tối ưu hiệu năng
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Chuyển đổi sang dạng Promise để code gọn gàng hơn (dùng async/await)
const db = pool.promise();

// Hàm test thử kết nối ngay khi khởi chạy
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Lỗi kết nối MySQL:', err.message);
    } else {
        console.log('✅ Đã kết nối thành công tới MySQL Database!');
        connection.release(); // Nhả kết nối ra sau khi test xong
    }
});

// Xuất file db ra để các file khác (như server.js) có thể gọi vào dùng
module.exports = db;