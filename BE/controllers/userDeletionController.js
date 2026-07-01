const db = require('../config/db');
const createNotification = require('../utils/createNotification');
const respondServerError = require('../utils/respondServerError');
const {
    deletionRequestValidator,
    deletionReviewValidator,
} = require('../validations/userDeletionValidation');

const disconnectUser = (app, userId) => app.get('io')?.in(`user_${userId}`).disconnectSockets(true);

const softDeleteEngineer = async (connection, userId, deletedBy, reason) => {
    const [users] = await connection.query(
        `SELECT id, fullname, role, status, deleted_at
         FROM users WHERE id = ? FOR UPDATE`,
        [userId]
    );
    if (!users.length) return { error: [404, 'Không tìm thấy người dùng.'] };
    const user = users[0];
    if (user.role !== 'engineer') {
        return { error: [403, 'Quy trình này chỉ áp dụng cho tài khoản Engineer.'] };
    }
    if (user.deleted_at) return { error: [409, 'Tài khoản này đã được xóa mềm trước đó.'] };
    if (user.status === 'pending') {
        return { error: [409, 'Tài khoản đang chờ phê duyệt đăng ký; hãy xử lý đăng ký thay vì xóa mềm.'] };
    }

    await connection.query(
        `UPDATE users
         SET status = 'inactive', deleted_at = NOW(), deleted_by = ?, deletion_reason = ?
         WHERE id = ?`,
        [deletedBy, reason, userId]
    );
    return { user };
};

const notifyActiveAdmins = async (app, notification) => {
    const [admins] = await db.query(
        `SELECT id FROM users
         WHERE role = 'admin' AND status = 'active' AND deleted_at IS NULL`
    );
    await Promise.all(admins.map(({ id }) => createNotification(app, {
        ...notification,
        userId: id,
    })));
};

exports.getManagerCandidates = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT u.id, u.username, u.fullname, u.email, u.employee_code, u.department,
                    COUNT(DISTINCT t.id) AS total_tasks,
                    SUM(t.status IN ('pending','in_progress','on_hold')) AS open_tasks,
                    GROUP_CONCAT(DISTINCT p.name ORDER BY p.name SEPARATOR ', ') AS project_names
             FROM users u
             JOIN tasks t ON t.engineer_id = u.id
             JOIN projects p ON p.id = t.project_id AND p.manager_id = ?
             WHERE u.role = 'engineer' AND u.status IN ('active','suspended') AND u.deleted_at IS NULL
             GROUP BY u.id
             ORDER BY u.fullname`,
            [req.user.id]
        );
        return res.json({ success: true, data: rows });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.getRequests = async (req, res) => {
    try {
        let query = `
            SELECT udr.id, udr.target_user_id, udr.requested_by, udr.reviewed_by,
                   udr.request_type, udr.reason, udr.status, udr.review_note,
                   udr.reviewed_at, udr.created_at,
                   target.username, target.fullname, target.email, target.employee_code,
                   requester.fullname AS requested_by_name,
                   reviewer.fullname AS reviewed_by_name
            FROM user_deletion_requests udr
            JOIN users target ON target.id = udr.target_user_id
            LEFT JOIN users requester ON requester.id = udr.requested_by
            LEFT JOIN users reviewer ON reviewer.id = udr.reviewed_by
        `;
        const params = [];
        if (req.user.role === 'manager') {
            query += ' WHERE udr.requested_by = ?';
            params.push(req.user.id);
        }
        query += ` ORDER BY FIELD(udr.status, 'pending','approved','rejected'), udr.created_at DESC`;
        const [rows] = await db.query(query, params);
        return res.json({ success: true, data: rows });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.requestDeletion = async (req, res) => {
    let connection;
    try {
        const { error, value } = deletionRequestValidator(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        connection = await db.getConnection();
        await connection.beginTransaction();
        const [users] = await connection.query(
            `SELECT id, fullname, role, status, deleted_at FROM users WHERE id = ? FOR UPDATE`,
            [value.user_id]
        );
        if (!users.length || users[0].deleted_at) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy Engineer đang hoạt động.' });
        }
        if (users[0].role !== 'engineer') {
            await connection.rollback();
            return res.status(403).json({ success: false, message: 'Manager chỉ có thể yêu cầu xóa tài khoản Engineer.' });
        }
        if (users[0].status === 'pending') {
            await connection.rollback();
            return res.status(409).json({ success: false, message: 'Tài khoản đang chờ duyệt đăng ký, không dùng quy trình xóa nhân sự.' });
        }

        const [access] = await connection.query(
            `SELECT 1
             FROM tasks t JOIN projects p ON p.id = t.project_id
             WHERE t.engineer_id = ? AND p.manager_id = ? LIMIT 1`,
            [value.user_id, req.user.id]
        );
        if (!access.length) {
            await connection.rollback();
            return res.status(403).json({ success: false, message: 'Engineer này không thuộc dự án bạn quản lý.' });
        }

        const [pending] = await connection.query(
            `SELECT id FROM user_deletion_requests
             WHERE target_user_id = ? AND status = 'pending' LIMIT 1`,
            [value.user_id]
        );
        if (pending.length) {
            await connection.rollback();
            return res.status(409).json({ success: false, message: 'Engineer này đã có yêu cầu xóa đang chờ Admin duyệt.' });
        }

        const [result] = await connection.query(
            `INSERT INTO user_deletion_requests
             (target_user_id, requested_by, request_type, reason)
             VALUES (?, ?, 'manager_request', ?)`,
            [value.user_id, req.user.id, value.reason]
        );
        await connection.query(
            `INSERT INTO activity_logs (user_id, action, description)
             VALUES (?, 'REQUEST_USER_DELETION', ?)`,
            [req.user.id, `Requested soft deletion for engineer #${value.user_id}: ${value.reason}`]
        );
        await connection.commit();

        await notifyActiveAdmins(req.app, {
            title: 'Yêu cầu xóa tài khoản Engineer',
            message: `${users[0].fullname} · ${value.reason}`,
            type: 'warning',
            link: '/admin/deleted-users',
        });
        return res.status(201).json({
            success: true,
            message: 'Đã gửi yêu cầu và thông báo cho Admin.',
            data: { id: result.insertId },
        });
    } catch (error) {
        if (connection) await connection.rollback().catch(() => {});
        return respondServerError(res, error);
    } finally {
        connection?.release();
    }
};

exports.directDelete = async (req, res) => {
    let connection;
    try {
        const { error, value } = deletionRequestValidator(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });
        if (value.user_id === req.user.id) {
            return res.status(400).json({ success: false, message: 'Không thể xóa tài khoản của chính bạn.' });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();
        const deletion = await softDeleteEngineer(connection, value.user_id, req.user.id, value.reason);
        if (deletion.error) {
            await connection.rollback();
            return res.status(deletion.error[0]).json({ success: false, message: deletion.error[1] });
        }
        await connection.query(
            `UPDATE user_deletion_requests
             SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(),
                 review_note = 'Tài khoản đã được Admin xử lý trực tiếp.'
             WHERE target_user_id = ? AND status = 'pending'`,
            [req.user.id, value.user_id]
        );
        const [result] = await connection.query(
            `INSERT INTO user_deletion_requests
             (target_user_id, requested_by, request_type, reason, status, reviewed_by, reviewed_at, review_note)
             VALUES (?, ?, 'admin_direct', ?, 'approved', ?, NOW(), 'Admin xóa mềm trực tiếp')`,
            [value.user_id, req.user.id, value.reason, req.user.id]
        );
        await connection.query(
            `INSERT INTO activity_logs (user_id, action, description)
             VALUES (?, 'SOFT_DELETE_USER', ?)`,
            [req.user.id, `Soft deleted engineer #${value.user_id}: ${value.reason}`]
        );
        await connection.commit();
        disconnectUser(req.app, value.user_id);
        return res.json({
            success: true,
            message: `Đã xóa mềm tài khoản ${deletion.user.fullname}. Toàn bộ dữ liệu lịch sử được giữ lại.`,
            data: { request_id: result.insertId },
        });
    } catch (error) {
        if (connection) await connection.rollback().catch(() => {});
        return respondServerError(res, error);
    } finally {
        connection?.release();
    }
};

exports.reviewRequest = async (req, res) => {
    let connection;
    try {
        const requestId = Number(req.params.id);
        if (!Number.isInteger(requestId) || requestId <= 0) {
            return res.status(400).json({ success: false, message: 'Yêu cầu không hợp lệ.' });
        }
        const { error, value } = deletionReviewValidator(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        connection = await db.getConnection();
        await connection.beginTransaction();
        const [requests] = await connection.query(
            `SELECT udr.*, target.fullname AS target_name
             FROM user_deletion_requests udr
             JOIN users target ON target.id = udr.target_user_id
             WHERE udr.id = ? FOR UPDATE`,
            [requestId]
        );
        if (!requests.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu.' });
        }
        const request = requests[0];
        if (request.status !== 'pending') {
            await connection.rollback();
            return res.status(409).json({ success: false, message: 'Yêu cầu này đã được xử lý.' });
        }

        if (value.decision === 'approved') {
            const deletion = await softDeleteEngineer(
                connection,
                request.target_user_id,
                req.user.id,
                request.reason
            );
            if (deletion.error) {
                await connection.rollback();
                return res.status(deletion.error[0]).json({ success: false, message: deletion.error[1] });
            }
        }

        await connection.query(
            `UPDATE user_deletion_requests
             SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_note = ?
             WHERE id = ?`,
            [value.decision, req.user.id, value.review_note || null, requestId]
        );
        await connection.query(
            `INSERT INTO activity_logs (user_id, action, description)
             VALUES (?, 'REVIEW_USER_DELETION', ?)`,
            [req.user.id, `${value.decision} deletion request #${requestId} for engineer #${request.target_user_id}`]
        );
        await connection.commit();

        if (value.decision === 'approved') disconnectUser(req.app, request.target_user_id);
        if (request.requested_by) {
            await createNotification(req.app, {
                userId: request.requested_by,
                title: value.decision === 'approved' ? 'Yêu cầu xóa tài khoản đã được duyệt' : 'Yêu cầu xóa tài khoản bị từ chối',
                message: `${request.target_name}${value.review_note ? ` · ${value.review_note}` : ''}`,
                type: value.decision === 'approved' ? 'success' : 'warning',
                link: '/manager/user-deletions',
            });
        }
        return res.json({
            success: true,
            message: value.decision === 'approved'
                ? 'Đã duyệt và xóa mềm tài khoản. Toàn bộ dữ liệu lịch sử được giữ lại.'
                : 'Đã từ chối yêu cầu.',
        });
    } catch (error) {
        if (connection) await connection.rollback().catch(() => {});
        return respondServerError(res, error);
    } finally {
        connection?.release();
    }
};

exports.getDeletedUsers = async (_req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT u.id, u.username, u.fullname, u.email, u.phone, u.role, u.status,
                    u.employee_code, u.department, u.job_title, u.created_at,
                    u.deleted_at, u.deleted_by, u.deletion_reason,
                    deleter.fullname AS deleted_by_name,
                    COUNT(DISTINCT t.id) AS total_tasks,
                    SUM(t.status IN ('pending','in_progress','on_hold')) AS open_tasks,
                    COUNT(DISTINCT r.id) AS total_reports
             FROM users u
             LEFT JOIN users deleter ON deleter.id = u.deleted_by
             LEFT JOIN tasks t ON t.engineer_id = u.id
             LEFT JOIN reports r ON r.engineer_id = u.id
             WHERE u.deleted_at IS NOT NULL
             GROUP BY u.id
             ORDER BY u.deleted_at DESC`
        );
        return res.json({ success: true, data: rows });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.restoreUser = async (req, res) => {
    let connection;
    try {
        const userId = Number(req.params.id);
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ success: false, message: 'Người dùng không hợp lệ.' });
        }
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [users] = await connection.query(
            `SELECT id, fullname, role, deleted_at FROM users WHERE id = ? FOR UPDATE`,
            [userId]
        );
        if (!users.length || !users[0].deleted_at) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản đã xóa.' });
        }
        await connection.query(
            `UPDATE users
             SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, status = 'suspended'
             WHERE id = ?`,
            [userId]
        );
        await connection.query(
            `INSERT INTO activity_logs (user_id, action, description)
             VALUES (?, 'RESTORE_USER', ?)`,
            [req.user.id, `Restored soft-deleted user #${userId} as suspended`]
        );
        await connection.commit();
        return res.json({
            success: true,
            message: `Đã khôi phục ${users[0].fullname} ở trạng thái khóa. Admin có thể mở khóa sau khi kiểm tra.`,
        });
    } catch (error) {
        if (connection) await connection.rollback().catch(() => {});
        return respondServerError(res, error);
    } finally {
        connection?.release();
    }
};
