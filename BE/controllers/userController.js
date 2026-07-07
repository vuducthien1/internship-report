const db = require('../config/db');
const bcrypt = require('bcryptjs');
const respondServerError = require('../utils/respondServerError');
const { createAuthSession, revokeUserSessions } = require('../utils/authSession');
const {
    updateRoleValidator,
    updateMyProfileValidator,
    adminUpdateProfileValidator,
    changePasswordValidator,
} = require('../validations/userValidation');

const profileColumns = `
    id, username, fullname, email, phone, role, status,
    employee_code, department, job_title, bio, avatar_url,
    email_verified_at, created_at, updated_at
`;

exports.getMyProfile = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT ${profileColumns} FROM users WHERE id = ? AND deleted_at IS NULL`,
            [req.user.id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
        return res.json({ success: true, data: rows[0] });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.updateMyProfile = async (req, res) => {
    try {
        const { error, value } = updateMyProfileValidator(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        await db.query(
            `UPDATE users SET phone = ?, bio = ?, avatar_url = ? WHERE id = ?`,
            [value.phone, value.bio || null, value.avatar_url || null, req.user.id]
        );
        await db.query(
            `INSERT INTO activity_logs (user_id, action, description)
             VALUES (?, 'UPDATE_OWN_PROFILE', 'Updated personal profile information')`,
            [req.user.id]
        );
        const [rows] = await db.query(`SELECT ${profileColumns} FROM users WHERE id = ?`, [req.user.id]);
        return res.json({ success: true, message: 'Đã cập nhật hồ sơ cá nhân.', data: rows[0] });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.changeMyPassword = async (req, res) => {
    try {
        const { error, value } = changePasswordValidator(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
        if (!rows.length || !(await bcrypt.compare(value.current_password, rows[0].password))) {
            return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác.' });
        }
        if (await bcrypt.compare(value.new_password, rows[0].password)) {
            return res.status(400).json({ success: false, message: 'Mật khẩu mới phải khác mật khẩu hiện tại.' });
        }

        const hash = await bcrypt.hash(value.new_password, 10);
        await db.query(
            'UPDATE users SET password = ?, auth_version = auth_version + 1 WHERE id = ?',
            [hash, req.user.id]
        );
        await revokeUserSessions(req.user.id);
        const [sessionUsers] = await db.query(
            'SELECT id, role, auth_version FROM users WHERE id = ? LIMIT 1',
            [req.user.id]
        );
        await createAuthSession(res, sessionUsers[0], req);
        await db.query(
            `INSERT INTO activity_logs (user_id, action, description)
             VALUES (?, 'CHANGE_PASSWORD', 'Changed account password')`,
            [req.user.id]
        );
        return res.json({ success: true, message: 'Đổi mật khẩu thành công.' });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.adminUpdateUserProfile = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ success: false, message: 'Người dùng không hợp lệ.' });
        }
        const { error, value } = adminUpdateProfileValidator(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const [duplicates] = await db.query(
            `SELECT id FROM users
             WHERE id <> ?
               AND (email = ? OR (? <> '' AND employee_code = ?))
             LIMIT 1`,
            [userId, value.email, value.employee_code, value.employee_code]
        );
        if (duplicates.length) {
            return res.status(409).json({ success: false, message: 'Email hoặc mã nhân viên đã được sử dụng.' });
        }

        const [result] = await db.query(
            `UPDATE users
             SET fullname = ?, email = ?, phone = ?, employee_code = ?, department = ?, job_title = ?
             WHERE id = ? AND deleted_at IS NULL`,
            [
                value.fullname,
                value.email,
                value.phone,
                value.employee_code || null,
                value.department || null,
                value.job_title || null,
                userId,
            ]
        );
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });

        await db.query(
            `INSERT INTO activity_logs (user_id, action, description)
             VALUES (?, 'ADMIN_UPDATE_USER_PROFILE', ?)`,
            [req.user.id, `Updated official profile for user #${userId}`]
        );
        return res.json({ success: true, message: 'Đã cập nhật hồ sơ nhân sự.' });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const search = (req.query.search || '').trim();
        let query = `
            SELECT ${profileColumns}
            FROM users
            WHERE deleted_at IS NULL
        `;
        const params = [];

        if (search) {
            query += ` AND (fullname LIKE ? OR username LIKE ? OR email LIKE ?)`;
            const term = `%${search}%`;
            params.push(term, term, term);
        }

        query += ` ORDER BY created_at DESC`;

        const [users] = await db.query(query, params);
        return res.status(200).json({ success: true, data: users });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        const { status } = req.body;

        if (!['active', 'suspended'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });
        }

        if (userId === req.user.id) {
            return res.status(400).json({ success: false, message: 'Không thể thay đổi trạng thái tài khoản của chính bạn.' });
        }

        const [users] = await db.query(
            `SELECT id, role, status FROM users WHERE id = ? AND deleted_at IS NULL`,
            [userId]
        );

        if (!users.length) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }

        const previousStatus = users[0].status;
        await db.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);

        const action = previousStatus === 'pending'
            ? (status === 'active' ? 'APPROVE_REGISTRATION' : 'REJECT_REGISTRATION')
            : 'UPDATE_USER_STATUS';

        await db.query(
            `INSERT INTO activity_logs (user_id, action, description) VALUES (?, ?, ?)`,
            [req.user.id, action, `Changed user #${userId} status from ${previousStatus} to ${status}`]
        );

        if (status === 'suspended') {
            const io = req.app.get('io');
            io?.in(`user_${userId}`).disconnectSockets(true);
        }

        return res.status(200).json({
            success: true,
            message: previousStatus === 'pending'
                ? (status === 'active' ? 'Đã phê duyệt tài khoản.' : 'Đã từ chối đăng ký.')
                : status === 'suspended' ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.',
        });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.updateUserRole = async (req, res) => {
    let connection;
    try {
        const userId = Number(req.params.id);
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ success: false, message: 'Người dùng không hợp lệ.' });
        }

        const { error, value } = updateRoleValidator(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }
        if (userId === req.user.id) {
            return res.status(400).json({ success: false, message: 'Không thể thay đổi quyền của chính bạn.' });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [users] = await connection.query(
            `SELECT id, role, status
             FROM users
             WHERE id = ? AND deleted_at IS NULL
             FOR UPDATE`,
            [userId]
        );
        if (!users.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }

        const target = users[0];
        if (target.role === 'admin') {
            await connection.rollback();
            return res.status(403).json({ success: false, message: 'Không thể thay đổi quyền của tài khoản Admin.' });
        }
        if (target.status !== 'active') {
            await connection.rollback();
            return res.status(409).json({ success: false, message: 'Chỉ có thể đổi quyền cho tài khoản đang hoạt động.' });
        }
        if (target.role === value.role) {
            await connection.rollback();
            return res.status(200).json({ success: true, message: 'Tài khoản đã có quyền này.' });
        }

        if (target.role === 'manager' && value.role === 'engineer') {
            const [projects] = await connection.query(
                'SELECT COUNT(*) AS total FROM projects WHERE manager_id = ?',
                [userId]
            );
            if (projects[0].total > 0) {
                await connection.rollback();
                return res.status(409).json({
                    success: false,
                    message: 'Hãy chuyển các dự án của Quản lý này cho người khác trước khi hạ quyền.',
                });
            }
        }

        if (target.role === 'engineer' && value.role === 'manager') {
            const [tasks] = await connection.query(
                `SELECT COUNT(*) AS total
                 FROM tasks
                 WHERE engineer_id = ?
                   AND status IN ('pending', 'in_progress', 'on_hold')`,
                [userId]
            );
            if (tasks[0].total > 0) {
                await connection.rollback();
                return res.status(409).json({
                    success: false,
                    message: 'Hãy hoàn thành hoặc chuyển các công việc đang mở trước khi nâng quyền.',
                });
            }
        }

        await connection.query('UPDATE users SET role = ? WHERE id = ?', [value.role, userId]);
        await connection.query(
            `INSERT INTO activity_logs (user_id, action, description)
             VALUES (?, 'UPDATE_USER_ROLE', ?)`,
            [req.user.id, `Changed user #${userId} role from ${target.role} to ${value.role}`]
        );
        await connection.commit();

        const io = req.app.get('io');
        io?.in(`user_${userId}`).disconnectSockets(true);

        return res.status(200).json({
            success: true,
            message: value.role === 'manager'
                ? 'Đã nâng quyền tài khoản lên Quản lý.'
                : 'Đã hạ quyền tài khoản xuống Kỹ sư.',
            data: { id: userId, role: value.role },
        });
    } catch (error) {
        if (connection) await connection.rollback().catch(() => {});
        return respondServerError(res, error);
    } finally {
        connection?.release();
    }
};

exports.getManagers = async (req, res) => {
    try {
        const search = (req.query.search || '').trim();
        let query = `
            SELECT id, fullname, username, email, role
            FROM users
            WHERE deleted_at IS NULL
              AND status = 'active'
              AND role IN ('manager', 'admin')
        `;
        const params = [];

        if (search) {
            query += ` AND (fullname LIKE ? OR username LIKE ? OR email LIKE ?)`;
            const term = `%${search}%`;
            params.push(term, term, term);
        }

        query += ` ORDER BY fullname ASC`;

        const [users] = await db.query(query, params);
        return res.status(200).json({ success: true, data: users });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.getEngineers = async (req, res) => {
    try {
        const search = (req.query.search || '').trim();
        let query = `
            SELECT id, fullname, username, email, role
            FROM users
            WHERE deleted_at IS NULL
              AND status = 'active'
              AND role = 'engineer'
        `;
        const params = [];

        if (search) {
            query += ` AND (fullname LIKE ? OR username LIKE ? OR email LIKE ?)`;
            const term = `%${search}%`;
            params.push(term, term, term);
        }

        query += ` ORDER BY fullname ASC`;

        const [users] = await db.query(query, params);
        return res.status(200).json({ success: true, data: users });
    } catch (error) {
        return respondServerError(res, error);
    }
};
