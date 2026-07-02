const bcrypt = require('bcryptjs');
const db = require('./db');

const bootstrapAdmin = async () => {
    const username = process.env.BOOTSTRAP_ADMIN_USERNAME;
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
    const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
    if (!username || !email || !password) return;

    const [admins] = await db.query(
        `SELECT id FROM users WHERE role = 'admin' AND deleted_at IS NULL LIMIT 1`
    );
    if (admins.length) return;

    const passwordHash = await bcrypt.hash(password, 12);
    await db.query(
        `INSERT INTO users
         (username, fullname, email, password, role, status, email_verified_at, department, job_title)
         VALUES (?, 'Quản trị viên hệ thống', ?, ?, 'admin', 'active', NOW(), 'Ban quản trị', 'System Administrator')`,
        [username, email, passwordHash]
    );
    console.log('✅ Đã tạo tài khoản Admin khởi tạo từ biến môi trường bảo mật.');
};

module.exports = bootstrapAdmin;
