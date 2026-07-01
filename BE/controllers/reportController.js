const db = require('../config/db');
const { reportValidator, reviewReportValidator } = require('../validations/reportValidation');
const respondServerError = require('../utils/respondServerError');
const createNotification = require('../utils/createNotification');
const fs = require('fs');

const removeUploadedFile = async (file) => {
    if (file?.path) await fs.promises.unlink(file.path).catch(() => {});
};

exports.createReport = async (req, res) => {
    let connection;
    try {
        const { error, value } = reportValidator(req.body);
        if (error) {
            await removeUploadedFile(req.file);
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const {
            task_id,
            content,
            status,
            report_type,
            work_quantity,
            blockers,
            safety_notes,
            next_plan,
        } = value;
        const engineer_id = req.user.id;

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [task] = await connection.query(
            `SELECT t.id, t.title, t.status, p.manager_id, manager.role AS manager_role
             FROM tasks t
             JOIN projects p ON p.id = t.project_id
             LEFT JOIN users manager ON manager.id = p.manager_id
             WHERE t.id = ? AND t.engineer_id = ?
             FOR UPDATE`,
            [task_id, engineer_id]
        );
        if (task.length === 0) {
            await connection.rollback();
            await removeUploadedFile(req.file);
            return res.status(403).json({ success: false, message: 'Bạn không có quyền báo cáo cho công việc này!' });
        }

        const [pendingReports] = await connection.query(
            `SELECT id FROM reports
             WHERE task_id = ? AND engineer_id = ? AND approval_status = 'pending'
             LIMIT 1`,
            [task_id, engineer_id]
        );
        if (pendingReports.length) {
            await connection.rollback();
            await removeUploadedFile(req.file);
            return res.status(409).json({
                success: false,
                message: 'Công việc này đã có báo cáo đang chờ duyệt.',
            });
        }

        const [reportResult] = await connection.query(
            `INSERT INTO reports
             (task_id, engineer_id, content, report_type, media_url, work_quantity, blockers,
              safety_notes, next_plan, proposed_status, approval_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [
                task_id,
                engineer_id,
                content,
                report_type,
                req.file ? `/uploads/reports/${req.file.filename}` : null,
                work_quantity || null,
                blockers || null,
                safety_notes || null,
                next_plan || null,
                status,
            ]
        );

        await connection.query(
            `INSERT INTO task_updates (task_id, user_id, event_type, message)
             VALUES (?, ?, 'report_submitted', ?)`,
            [task_id, engineer_id, `Đã gửi báo cáo #${reportResult.insertId} và chờ phê duyệt`]
        );

        await connection.query(
            `INSERT INTO activity_logs (user_id, action, description)
             VALUES (?, 'SUBMIT_REPORT', ?)`,
            [engineer_id, `Submitted report for task #${task_id}; proposed status: ${status}`]
        );

        await connection.commit();
        if (task[0].manager_id) {
            await createNotification(req.app, {
                userId: task[0].manager_id,
                title: 'Báo cáo mới cần duyệt',
                message: `Công việc “${task[0].title}” vừa có báo cáo mới.`,
                type: 'report',
                link: `/${task[0].manager_role === 'admin' ? 'admin' : 'manager'}/reports`,
            }).catch(() => {});
        }
        return res.status(201).json({ success: true, message: 'Đã gửi báo cáo và chờ quản lý phê duyệt.' });
    } catch (error) {
        if (connection) await connection.rollback();
        await removeUploadedFile(req.file);
        return respondServerError(res, error);
    } finally {
        connection?.release();
    }
};

exports.getAllReports = async (req, res) => {
    try {
        let query = `
            SELECT r.id, r.task_id, r.engineer_id, r.content, r.media_url,
                   r.created_at, r.report_type, r.work_quantity, r.blockers,
                   r.safety_notes, r.next_plan, r.proposed_status,
                   r.approval_status, r.reviewed_by, r.reviewed_at, r.review_note,
                   u.fullname AS engineer_name, u.username AS engineer_username,
                   reviewer.fullname AS reviewer_name,
                   t.title AS task_title, t.status AS task_status,
                   p.id AS project_id, p.name AS project_name
            FROM reports r
            JOIN users u ON r.engineer_id = u.id
            LEFT JOIN users reviewer ON reviewer.id = r.reviewed_by
            JOIN tasks t ON r.task_id = t.id
            JOIN projects p ON t.project_id = p.id
        `;
        const params = [];

        if (req.user.role === 'manager') {
            query += ' WHERE p.manager_id = ?';
            params.push(req.user.id);
        } else if (req.user.role === 'engineer') {
            query += ' WHERE r.engineer_id = ?';
            params.push(req.user.id);
        }

        query += ' ORDER BY r.created_at DESC';
        const [reports] = await db.query(query, params);

        return res.status(200).json({ success: true, data: reports });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.reviewReport = async (req, res) => {
    let connection;
    try {
        const reportId = Number(req.params.id);
        if (!Number.isInteger(reportId) || reportId <= 0) {
            return res.status(400).json({ success: false, message: 'Báo cáo không hợp lệ.' });
        }
        const { error, value } = reviewReportValidator(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        connection = await db.getConnection();
        await connection.beginTransaction();
        const [rows] = await connection.query(
            `SELECT r.id, r.engineer_id, r.approval_status, r.proposed_status,
                    t.id AS task_id, t.title AS task_title, p.manager_id
             FROM reports r
             JOIN tasks t ON t.id = r.task_id
             JOIN projects p ON p.id = t.project_id
             WHERE r.id = ? FOR UPDATE`,
            [reportId]
        );
        if (!rows.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo.' });
        }
        const report = rows[0];
        if (req.user.role === 'manager' && report.manager_id !== req.user.id) {
            await connection.rollback();
            return res.status(403).json({ success: false, message: 'Bạn không quản lý dự án của báo cáo này.' });
        }
        if (report.approval_status !== 'pending') {
            await connection.rollback();
            return res.status(409).json({ success: false, message: 'Báo cáo này đã được xử lý.' });
        }

        await connection.query(
            `UPDATE reports
             SET approval_status = ?, reviewed_by = ?, reviewed_at = NOW(), review_note = ?
             WHERE id = ?`,
            [value.decision, req.user.id, value.review_note || null, reportId]
        );
        if (value.decision === 'approved') {
            await connection.query('UPDATE tasks SET status = ? WHERE id = ?', [report.proposed_status, report.task_id]);
        }
        await connection.query(
            `INSERT INTO task_updates (task_id, user_id, event_type, message)
             VALUES (?, ?, 'report_review', ?)`,
            [report.task_id, req.user.id, `${value.decision === 'approved' ? 'Đã duyệt' : 'Yêu cầu bổ sung'} báo cáo #${reportId}`]
        );
        await connection.query(
            `INSERT INTO activity_logs (user_id, action, description)
             VALUES (?, 'REVIEW_REPORT', ?)`,
            [req.user.id, `${value.decision} report #${reportId}`]
        );
        await connection.commit();

        await createNotification(req.app, {
            userId: report.engineer_id,
            title: value.decision === 'approved' ? 'Báo cáo đã được duyệt' : 'Báo cáo cần bổ sung',
            message: value.decision === 'approved'
                ? `Báo cáo cho công việc “${report.task_title}” đã được duyệt.`
                : `Báo cáo cho công việc “${report.task_title}” bị từ chối: ${value.review_note}`,
            type: value.decision === 'approved' ? 'success' : 'warning',
            link: '/engineer/reports',
        }).catch(() => {});

        return res.json({
            success: true,
            message: value.decision === 'approved' ? 'Đã duyệt báo cáo.' : 'Đã từ chối và gửi lý do cho kỹ sư.',
        });
    } catch (error) {
        if (connection) await connection.rollback().catch(() => {});
        return respondServerError(res, error);
    } finally {
        connection?.release();
    }
};
