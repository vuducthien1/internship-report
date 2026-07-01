const db = require('../config/db');
const createNotification = require('../utils/createNotification');
const respondServerError = require('../utils/respondServerError');
const { taskRequestValidator, taskRequestReviewValidator } = require('../validations/operationValidation');

exports.getRequests = async (req, res) => {
    try {
        let query = `
            SELECT tr.*, t.title AS task_title, t.due_date AS current_due_date,
                   p.name AS project_name, engineer.fullname AS engineer_name,
                   reviewer.fullname AS reviewer_name
            FROM task_requests tr
            JOIN tasks t ON t.id = tr.task_id
            JOIN projects p ON p.id = t.project_id
            JOIN users engineer ON engineer.id = tr.engineer_id
            LEFT JOIN users reviewer ON reviewer.id = tr.reviewed_by`;
        const params = [];
        if (req.user.role === 'engineer') { query += ' WHERE tr.engineer_id = ?'; params.push(req.user.id); }
        if (req.user.role === 'manager') { query += ' WHERE p.manager_id = ?'; params.push(req.user.id); }
        query += ' ORDER BY tr.created_at DESC';
        const [rows] = await db.query(query, params);
        return res.json({ success: true, data: rows });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.createRequest = async (req, res) => {
    try {
        const { error, value } = taskRequestValidator(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });
        const [tasks] = await db.query(
            `SELECT t.id, t.title, t.status, t.due_date, p.manager_id, manager.role AS manager_role
             FROM tasks t JOIN projects p ON p.id = t.project_id
             LEFT JOIN users manager ON manager.id = p.manager_id
             WHERE t.id = ? AND t.engineer_id = ?`,
            [value.task_id, req.user.id]
        );
        if (!tasks.length) return res.status(403).json({ success: false, message: 'Bạn không có quyền gửi yêu cầu cho công việc này.' });
        if (['completed', 'cancelled'].includes(tasks[0].status)) return res.status(409).json({ success: false, message: 'Công việc đã kết thúc, không thể gửi yêu cầu mới.' });
        const [pending] = await db.query(
            `SELECT id FROM task_requests WHERE task_id = ? AND request_type = ? AND status = 'pending' LIMIT 1`,
            [value.task_id, value.request_type]
        );
        if (pending.length) return res.status(409).json({ success: false, message: 'Đã có yêu cầu cùng loại đang chờ xử lý.' });
        if (value.request_type === 'extension' && tasks[0].due_date && new Date(value.requested_due_date) <= new Date(tasks[0].due_date)) {
            return res.status(400).json({ success: false, message: 'Hạn đề xuất phải sau hạn hiện tại.' });
        }

        const [result] = await db.query(
            `INSERT INTO task_requests (task_id, engineer_id, request_type, requested_due_date, reason)
             VALUES (?, ?, ?, ?, ?)`,
            [value.task_id, req.user.id, value.request_type, value.requested_due_date || null, value.reason]
        );
        await db.query(
            `INSERT INTO task_updates (task_id, user_id, event_type, message) VALUES (?, ?, 'request', ?)`,
            [value.task_id, req.user.id, `${value.request_type === 'extension' ? 'Yêu cầu gia hạn' : 'Báo vướng mắc'} #${result.insertId}`]
        );
        if (tasks[0].manager_id) {
            await createNotification(req.app, {
                userId: tasks[0].manager_id,
                title: value.request_type === 'extension' ? 'Yêu cầu gia hạn mới' : 'Vướng mắc mới từ hiện trường',
                message: tasks[0].title,
                type: 'task',
                link: `/${tasks[0].manager_role === 'admin' ? 'admin' : 'manager'}/requests`,
            }).catch(() => {});
        }
        return res.status(201).json({ success: true, message: 'Đã gửi yêu cầu đến quản lý.' });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.reviewRequest = async (req, res) => {
    let connection;
    try {
        const requestId = Number(req.params.id);
        const { error, value } = taskRequestReviewValidator(req.body);
        if (!Number.isInteger(requestId) || requestId <= 0 || error) return res.status(400).json({ success: false, message: error?.details[0]?.message || 'Yêu cầu không hợp lệ.' });
        connection = await db.getConnection();
        await connection.beginTransaction();
        let query = `
            SELECT tr.*, t.title AS task_title, p.manager_id
            FROM task_requests tr JOIN tasks t ON t.id = tr.task_id JOIN projects p ON p.id = t.project_id
            WHERE tr.id = ?`;
        const params = [requestId];
        if (req.user.role === 'manager') { query += ' AND p.manager_id = ?'; params.push(req.user.id); }
        query += ' FOR UPDATE';
        const [rows] = await connection.query(query, params);
        if (!rows.length) { await connection.rollback(); return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu.' }); }
        const request = rows[0];
        if (request.status !== 'pending') { await connection.rollback(); return res.status(409).json({ success: false, message: 'Yêu cầu này đã được xử lý.' }); }
        await connection.query(
            `UPDATE task_requests SET status = ?, review_note = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
            [value.decision, value.review_note || null, req.user.id, requestId]
        );
        if (value.decision === 'approved' && request.request_type === 'extension') {
            await connection.query('UPDATE tasks SET due_date = ? WHERE id = ?', [request.requested_due_date, request.task_id]);
        }
        await connection.query(
            `INSERT INTO task_updates (task_id, user_id, event_type, message) VALUES (?, ?, 'request_review', ?)`,
            [request.task_id, req.user.id, `${value.decision === 'approved' ? 'Đã duyệt' : 'Đã từ chối'} yêu cầu #${requestId}`]
        );
        await connection.commit();
        await createNotification(req.app, {
            userId: request.engineer_id,
            title: value.decision === 'approved' ? 'Yêu cầu đã được duyệt' : 'Yêu cầu bị từ chối',
            message: `${request.task_title}${value.review_note ? ` — ${value.review_note}` : ''}`,
            type: value.decision === 'approved' ? 'success' : 'warning',
            link: '/engineer/requests',
        }).catch(() => {});
        return res.json({ success: true, message: value.decision === 'approved' ? 'Đã duyệt yêu cầu.' : 'Đã từ chối yêu cầu.' });
    } catch (error) {
        if (connection) await connection.rollback().catch(() => {});
        return respondServerError(res, error);
    } finally {
        connection?.release();
    }
};
