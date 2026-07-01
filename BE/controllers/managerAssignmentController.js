const db = require('../config/db');
const createNotification = require('../utils/createNotification');
const respondServerError = require('../utils/respondServerError');
const {
    createManagerAssignmentValidator,
    updateManagerAssignmentValidator,
    cancelManagerAssignmentValidator,
} = require('../validations/managerAssignmentValidation');

const assignmentSelect = `
    SELECT ma.id, ma.manager_id, ma.project_id, ma.assigned_by, ma.title,
           ma.description, ma.due_date, ma.priority, ma.status,
           ma.progress_percent, ma.manager_note, ma.cancel_reason,
           ma.accepted_at, ma.completed_at, ma.created_at, ma.updated_at,
           manager.fullname AS manager_name,
           assigner.fullname AS assigned_by_name,
           p.name AS project_name
    FROM manager_assignments ma
    JOIN users manager ON manager.id = ma.manager_id
    LEFT JOIN users assigner ON assigner.id = ma.assigned_by
    LEFT JOIN projects p ON p.id = ma.project_id
`;

exports.getAssignments = async (req, res) => {
    try {
        let query = assignmentSelect;
        const params = [];
        if (req.user.role === 'manager') {
            query += ' WHERE ma.manager_id = ?';
            params.push(req.user.id);
        }
        query += ` ORDER BY FIELD(ma.status, 'assigned','accepted','in_progress','completed','cancelled'),
                            ma.due_date IS NULL, ma.due_date, ma.created_at DESC`;
        const [rows] = await db.query(query, params);
        return res.json({ success: true, data: rows });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.createAssignment = async (req, res) => {
    try {
        const { error, value } = createManagerAssignmentValidator(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const [managers] = await db.query(
            `SELECT id, fullname FROM users
             WHERE id = ? AND role = 'manager' AND status = 'active' AND deleted_at IS NULL`,
            [value.manager_id]
        );
        if (!managers.length) {
            return res.status(400).json({ success: false, message: 'Manager không hợp lệ hoặc không còn hoạt động.' });
        }

        if (value.project_id) {
            const [projects] = await db.query(
                'SELECT id FROM projects WHERE id = ? AND manager_id = ?',
                [value.project_id, value.manager_id]
            );
            if (!projects.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Dự án được chọn hiện không thuộc Manager này.',
                });
            }
        }

        const [result] = await db.query(
            `INSERT INTO manager_assignments
             (manager_id, project_id, assigned_by, title, description, due_date, priority)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                value.manager_id,
                value.project_id || null,
                req.user.id,
                value.title,
                value.description,
                value.due_date || null,
                value.priority,
            ]
        );

        await db.query(
            `INSERT INTO activity_logs (user_id, action, description)
             VALUES (?, 'ASSIGN_MANAGER_TASK', ?)`,
            [req.user.id, `Assigned management task #${result.insertId} to manager #${value.manager_id}`]
        );
        await createNotification(req.app, {
            userId: value.manager_id,
            title: 'Nhiệm vụ quản lý mới',
            message: `${value.title}${value.due_date ? ` · Hạn ${String(value.due_date).slice(0, 10)}` : ''}`,
            type: value.priority === 'urgent' ? 'warning' : 'task',
            link: '/manager/assignments',
        });

        return res.status(201).json({
            success: true,
            message: `Đã giao nhiệm vụ cho ${managers[0].fullname}.`,
            data: { id: result.insertId },
        });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.updateProgress = async (req, res) => {
    try {
        const assignmentId = Number(req.params.id);
        if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
            return res.status(400).json({ success: false, message: 'Nhiệm vụ không hợp lệ.' });
        }
        const { error, value } = updateManagerAssignmentValidator(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const [rows] = await db.query(
            `SELECT id, title, assigned_by, status, progress_percent FROM manager_assignments
             WHERE id = ? AND manager_id = ?`,
            [assignmentId, req.user.id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy nhiệm vụ.' });
        if (['completed', 'cancelled'].includes(rows[0].status)) {
            return res.status(409).json({ success: false, message: 'Nhiệm vụ đã kết thúc và không thể cập nhật.' });
        }

        const allowedTransitions = {
            assigned: ['accepted', 'in_progress', 'completed'],
            accepted: ['accepted', 'in_progress', 'completed'],
            in_progress: ['in_progress', 'completed'],
        };
        if (!allowedTransitions[rows[0].status]?.includes(value.status)) {
            return res.status(409).json({ success: false, message: 'Không thể đưa nhiệm vụ trở lại trạng thái trước đó.' });
        }

        const progress = value.status === 'completed' ? 100 : value.progress_percent;
        if (progress < Number(rows[0].progress_percent || 0)) {
            return res.status(409).json({ success: false, message: 'Tiến độ mới không được thấp hơn tiến độ đã báo cáo.' });
        }
        await db.query(
            `UPDATE manager_assignments
             SET status = ?, progress_percent = ?, manager_note = ?,
                 accepted_at = CASE WHEN ? IN ('accepted','in_progress','completed') THEN COALESCE(accepted_at, NOW()) ELSE accepted_at END,
                 completed_at = CASE WHEN ? = 'completed' THEN NOW() ELSE NULL END
             WHERE id = ?`,
            [value.status, progress, value.manager_note || null, value.status, value.status, assignmentId]
        );
        await db.query(
            `INSERT INTO activity_logs (user_id, action, description)
             VALUES (?, 'UPDATE_MANAGER_ASSIGNMENT', ?)`,
            [req.user.id, `Updated management task #${assignmentId} to ${value.status} (${progress}%)`]
        );
        if (rows[0].assigned_by) {
            await createNotification(req.app, {
                userId: rows[0].assigned_by,
                title: value.status === 'completed' ? 'Nhiệm vụ quản lý đã hoàn thành' : 'Nhiệm vụ quản lý được cập nhật',
                message: `${rows[0].title} · ${progress}%`,
                type: value.status === 'completed' ? 'success' : 'info',
                link: '/admin/manager-assignments',
            });
        }
        return res.json({ success: true, message: 'Đã cập nhật tiến độ nhiệm vụ.' });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.cancelAssignment = async (req, res) => {
    try {
        const assignmentId = Number(req.params.id);
        const { error, value } = cancelManagerAssignmentValidator(req.body);
        if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
            return res.status(400).json({ success: false, message: 'Nhiệm vụ không hợp lệ.' });
        }
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const [rows] = await db.query(
            `SELECT id, manager_id, title, status FROM manager_assignments WHERE id = ?`,
            [assignmentId]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy nhiệm vụ.' });
        if (['completed', 'cancelled'].includes(rows[0].status)) {
            return res.status(409).json({ success: false, message: 'Nhiệm vụ đã kết thúc.' });
        }

        await db.query(
            `UPDATE manager_assignments SET status = 'cancelled', cancel_reason = ? WHERE id = ?`,
            [value.reason, assignmentId]
        );
        await db.query(
            `INSERT INTO activity_logs (user_id, action, description)
             VALUES (?, 'CANCEL_MANAGER_ASSIGNMENT', ?)`,
            [req.user.id, `Cancelled management task #${assignmentId}: ${value.reason}`]
        );
        await createNotification(req.app, {
            userId: rows[0].manager_id,
            title: 'Nhiệm vụ quản lý đã được hủy',
            message: `${rows[0].title} · ${value.reason}`,
            type: 'warning',
            link: '/manager/assignments',
        });
        return res.json({ success: true, message: 'Đã hủy nhiệm vụ.' });
    } catch (error) {
        return respondServerError(res, error);
    }
};
