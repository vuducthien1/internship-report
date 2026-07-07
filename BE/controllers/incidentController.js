const fs = require('fs');
const db = require('../config/db');
const createNotification = require('../utils/createNotification');
const respondServerError = require('../utils/respondServerError');
const { incidentValidator, incidentStatusValidator } = require('../validations/operationValidation');

const removeFile = async (file) => file?.path && fs.promises.unlink(file.path).catch(() => {});

exports.getIncidents = async (req, res) => {
    try {
        let query = `SELECT i.*, p.name AS project_name, t.title AS task_title,
                            engineer.fullname AS engineer_name, assignee.fullname AS assigned_to_name
                     FROM safety_incidents i JOIN projects p ON p.id = i.project_id
                     LEFT JOIN tasks t ON t.id = i.task_id JOIN users engineer ON engineer.id = i.engineer_id
                     LEFT JOIN users assignee ON assignee.id = i.assigned_to`;
        const params = [];
        if (req.user.role === 'engineer') { query += ' WHERE i.engineer_id = ?'; params.push(req.user.id); }
        if (req.user.role === 'manager') { query += ' WHERE p.manager_id = ?'; params.push(req.user.id); }
        query += ` ORDER BY FIELD(i.severity, 'critical','high','medium','low'), i.created_at DESC`;
        const [rows] = await db.query(query, params);
        return res.json({ success: true, data: rows });
    } catch (error) { return respondServerError(res, error); }
};

exports.createIncident = async (req, res) => {
    try {
        const { error, value } = incidentValidator(req.body);
        if (error) { await removeFile(req.file); return res.status(400).json({ success: false, message: error.details[0].message }); }
        const [projects] = await db.query(
            `SELECT p.id, p.name, p.manager_id, manager.role AS manager_role FROM projects p
             LEFT JOIN users manager ON manager.id = p.manager_id WHERE p.id = ?
             AND EXISTS (SELECT 1 FROM tasks t WHERE t.project_id = p.id AND t.engineer_id = ?)`,
            [value.project_id, req.user.id]
        );
        if (!projects.length) { await removeFile(req.file); return res.status(403).json({ success: false, message: 'Bạn không thuộc dự án này.' }); }
        if (value.task_id) {
            const [tasks] = await db.query('SELECT id FROM tasks WHERE id = ? AND project_id = ? AND engineer_id = ?', [value.task_id, value.project_id, req.user.id]);
            if (!tasks.length) { await removeFile(req.file); return res.status(403).json({ success: false, message: 'Công việc không thuộc quyền của bạn.' }); }
        }
        const [result] = await db.query(
            `INSERT INTO safety_incidents (project_id, task_id, engineer_id, title, description, severity, location_text, latitude, longitude, image_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [value.project_id, value.task_id || null, req.user.id, value.title, value.description, value.severity, value.location_text || null, value.latitude, value.longitude, req.file ? `/uploads/incidents/${req.file.filename}` : null]
        );
        if (value.task_id) await db.query(`INSERT INTO task_updates (task_id, user_id, event_type, message) VALUES (?, ?, 'incident', ?)`, [value.task_id, req.user.id, `Báo cáo sự cố #${result.insertId}: ${value.title}`]);
        if (projects[0].manager_id) await createNotification(req.app, { userId: projects[0].manager_id, title: value.severity === 'critical' ? 'Sự cố nghiêm trọng tại công trường' : 'Có báo cáo sự cố mới', message: `${projects[0].name} — ${value.title}`, type: 'warning', link: `/${projects[0].manager_role === 'admin' ? 'admin' : 'manager'}/incidents`, push: value.severity === 'critical', urgent: value.severity === 'critical' }).catch(() => {});
        return res.status(201).json({ success: true, message: 'Đã gửi báo cáo sự cố đến quản lý.' });
    } catch (error) { await removeFile(req.file); return respondServerError(res, error); }
};

exports.updateIncidentStatus = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { error, value } = incidentStatusValidator(req.body);
        if (!Number.isInteger(id) || id <= 0 || error) return res.status(400).json({ success: false, message: error?.details[0]?.message || 'Dữ liệu xử lý sự cố không hợp lệ.' });
        if (value.status === 'resolved' && (value.root_cause.length < 5 || value.corrective_action.length < 5)) return res.status(400).json({ success: false, message: 'Cần nhập nguyên nhân gốc và biện pháp khắc phục trước khi đóng sự cố.' });
        let query = `SELECT i.id, i.engineer_id, i.title, i.project_id, p.manager_id FROM safety_incidents i JOIN projects p ON p.id = i.project_id WHERE i.id = ?`;
        const params = [id];
        if (req.user.role === 'manager') { query += ' AND p.manager_id = ?'; params.push(req.user.id); }
        const [rows] = await db.query(query, params);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy sự cố hoặc bạn không có quyền cập nhật.' });
        if (value.assigned_to) {
            const [assignees] = await db.query(
                `SELECT u.id, u.role FROM users u WHERE u.id = ? AND u.status = 'active' AND u.deleted_at IS NULL
                 AND (u.role IN ('admin','manager') OR EXISTS (SELECT 1 FROM tasks t WHERE t.project_id = ? AND t.engineer_id = u.id))`,
                [value.assigned_to, rows[0].project_id]
            );
            if (!assignees.length) return res.status(400).json({ success: false, message: 'Người phụ trách không thuộc dự án hoặc không hoạt động.' });
        }
        await db.query(
            `UPDATE safety_incidents SET status = ?, assigned_to = ?, root_cause = ?, corrective_action = ?, target_resolution_date = ?,
             resolved_by = ?, resolved_at = ${value.status === 'resolved' ? 'NOW()' : 'NULL'} WHERE id = ?`,
            [value.status, value.assigned_to || null, value.root_cause || null, value.corrective_action || null, value.target_resolution_date || null, value.status === 'resolved' ? req.user.id : null, id]
        );
        await db.query(`INSERT INTO activity_logs (user_id, action, description) VALUES (?, 'UPDATE_INCIDENT', ?)`, [req.user.id, `Updated incident #${id} to ${value.status}`]);
        await createNotification(req.app, { userId: rows[0].engineer_id, title: 'Trạng thái sự cố đã thay đổi', message: `${rows[0].title} — ${value.status}`, type: value.status === 'resolved' ? 'success' : 'info', link: '/engineer/incidents' }).catch(() => {});
        if (value.assigned_to && Number(value.assigned_to) !== Number(rows[0].engineer_id)) {
            const [assignees] = await db.query('SELECT role FROM users WHERE id = ?', [value.assigned_to]);
            const rolePath = assignees[0]?.role === 'admin' ? 'admin' : assignees[0]?.role === 'manager' ? 'manager' : 'engineer';
            await createNotification(req.app, { userId: value.assigned_to, title: 'Bạn được giao xử lý sự cố', message: rows[0].title, type: 'warning', link: `/${rolePath}/incidents` }).catch(() => {});
        }
        return res.json({ success: true, message: 'Đã cập nhật kế hoạch xử lý sự cố.' });
    } catch (error) { return respondServerError(res, error); }
};

exports.uploadResolutionEvidence = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0 || !req.file) { await removeFile(req.file); return res.status(400).json({ success: false, message: 'Vui lòng chọn ảnh minh chứng khắc phục.' }); }
        let query = `SELECT i.id FROM safety_incidents i JOIN projects p ON p.id = i.project_id WHERE i.id = ?`;
        const params = [id];
        if (req.user.role === 'manager') { query += ' AND p.manager_id = ?'; params.push(req.user.id); }
        const [rows] = await db.query(query, params);
        if (!rows.length) { await removeFile(req.file); return res.status(404).json({ success: false, message: 'Không tìm thấy sự cố hoặc bạn không có quyền cập nhật.' }); }
        const imageUrl = `/uploads/incidents/${req.file.filename}`;
        await db.query('UPDATE safety_incidents SET resolution_image_url = ? WHERE id = ?', [imageUrl, id]);
        return res.json({ success: true, message: 'Đã lưu ảnh minh chứng khắc phục.', data: { resolution_image_url: imageUrl } });
    } catch (error) { await removeFile(req.file); return respondServerError(res, error); }
};
