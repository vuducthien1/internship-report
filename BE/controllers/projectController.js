const db = require('../config/db');
const { projectValidator } = require('../validations/projectValidation');
const respondServerError = require('../utils/respondServerError');

const projectAccessClause = (user, alias = 'p') => {
    if (user.role === 'manager') return { sql: ` AND ${alias}.manager_id = ?`, params: [user.id] };
    if (user.role === 'engineer') return { sql: ` AND EXISTS (SELECT 1 FROM tasks access_task WHERE access_task.project_id = ${alias}.id AND access_task.engineer_id = ?)`, params: [user.id] };
    return { sql: '', params: [] };
};

exports.createProject = async (req, res) => {
    try {
        const { error, value } = projectValidator(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });
        const effectiveManagerId = req.user.role === 'manager' ? req.user.id : value.manager_id;
        const [managers] = await db.query(
            `SELECT id FROM users WHERE id = ? AND role IN ('admin','manager') AND status = 'active' AND deleted_at IS NULL`,
            [effectiveManagerId]
        );
        if (!managers.length) return res.status(400).json({ success: false, message: 'Tài khoản quản lý không hợp lệ hoặc không hoạt động.' });
        const [result] = await db.query(
            `INSERT INTO projects (name, description, location, manager_id, start_date, end_date, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [value.name, value.description || null, value.location, effectiveManagerId, value.start_date, value.end_date, value.status || 'planning']
        );
        await db.query(`INSERT INTO activity_logs (user_id, action, description) VALUES (?, 'CREATE_PROJECT', ?)`, [req.user.id, `Created project #${result.insertId}`]);
        return res.status(201).json({ success: true, message: 'Tạo dự án mới thành công!', data: { id: result.insertId } });
    } catch (error) { return respondServerError(res, error); }
};

exports.getAllProjects = async (req, res) => {
    try {
        let query = `SELECT p.*, u.fullname AS manager_name,
                            COUNT(t.id) AS task_total, SUM(t.status = 'completed') AS task_completed,
                            ROUND(COALESCE(100 * SUM(t.status = 'completed') / NULLIF(COUNT(t.id), 0), 0)) AS progress
                     FROM projects p JOIN users u ON u.id = p.manager_id LEFT JOIN tasks t ON t.project_id = p.id WHERE 1 = 1`;
        const access = projectAccessClause(req.user);
        query += `${access.sql} GROUP BY p.id ORDER BY p.created_at DESC`;
        const [projects] = await db.query(query, access.params);
        return res.json({ success: true, data: projects });
    } catch (error) { return respondServerError(res, error); }
};

exports.getProjectById = async (req, res) => {
    try {
        const access = projectAccessClause(req.user);
        const [projects] = await db.query(
            `SELECT p.*, u.fullname AS manager_name, u.email AS manager_email
             FROM projects p JOIN users u ON u.id = p.manager_id WHERE p.id = ?${access.sql}`,
            [req.params.id, ...access.params]
        );
        if (!projects.length) return res.status(404).json({ success: false, message: 'Không tìm thấy dự án hoặc bạn không có quyền truy cập.' });
        return res.json({ success: true, data: projects[0] });
    } catch (error) { return respondServerError(res, error); }
};

exports.getProjectWorkspace = async (req, res) => {
    try {
        const projectId = Number(req.params.id);
        if (!Number.isInteger(projectId) || projectId <= 0) return res.status(400).json({ success: false, message: 'Dự án không hợp lệ.' });
        const access = projectAccessClause(req.user);
        const [projects] = await db.query(`SELECT p.*, u.fullname AS manager_name FROM projects p JOIN users u ON u.id = p.manager_id WHERE p.id = ?${access.sql}`, [projectId, ...access.params]);
        if (!projects.length) return res.status(404).json({ success: false, message: 'Không tìm thấy dự án hoặc bạn không có quyền truy cập.' });
        const [tasks, reports, incidents, documents, engineers] = await Promise.all([
            db.query(`SELECT t.*, u.fullname AS engineer_name, COUNT(ci.id) AS checklist_total, SUM(ci.is_completed = 1) AS checklist_completed
                      FROM tasks t JOIN users u ON u.id = t.engineer_id LEFT JOIN task_checklist_items ci ON ci.task_id = t.id
                      WHERE t.project_id = ? GROUP BY t.id ORDER BY t.due_date IS NULL, t.due_date`, [projectId]),
            db.query(`SELECT r.id, r.task_id, r.approval_status, r.created_at, r.reviewed_at, t.title AS task_title, u.fullname AS engineer_name
                      FROM reports r JOIN tasks t ON t.id = r.task_id JOIN users u ON u.id = r.engineer_id
                      WHERE t.project_id = ? ORDER BY r.created_at DESC LIMIT 30`, [projectId]),
            db.query(`SELECT i.id, i.title, i.severity, i.status, i.target_resolution_date, i.created_at, reporter.fullname AS engineer_name, assignee.fullname AS assigned_to_name
                      FROM safety_incidents i JOIN users reporter ON reporter.id = i.engineer_id LEFT JOIN users assignee ON assignee.id = i.assigned_to
                      WHERE i.project_id = ? ORDER BY FIELD(i.severity, 'critical','high','medium','low'), i.created_at DESC`, [projectId]),
            db.query(`SELECT d.id, d.title, d.version, d.file_name, d.file_size, d.created_at, u.fullname AS uploaded_by_name
                      FROM project_documents d LEFT JOIN users u ON u.id = d.uploaded_by WHERE d.project_id = ? ORDER BY d.created_at DESC`, [projectId]),
            db.query(`SELECT u.id, u.fullname, u.employee_code, COUNT(t.id) AS tasks, SUM(t.status IN ('pending','in_progress','on_hold')) AS active_tasks
                      FROM users u JOIN tasks t ON t.engineer_id = u.id WHERE t.project_id = ? GROUP BY u.id ORDER BY u.fullname`, [projectId]),
        ]);
        return res.json({ success: true, data: { project: projects[0], tasks: tasks[0], reports: reports[0], incidents: incidents[0], documents: documents[0], engineers: engineers[0] } });
    } catch (error) { return respondServerError(res, error); }
};

exports.updateProject = async (req, res) => {
    try {
        const { error, value } = projectValidator(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });
        const access = projectAccessClause(req.user);
        const [existing] = await db.query(`SELECT id, manager_id, status FROM projects p WHERE p.id = ?${access.sql}`, [req.params.id, ...access.params]);
        if (!existing.length) return res.status(404).json({ success: false, message: 'Không tìm thấy dự án hoặc bạn không có quyền chỉnh sửa.' });
        if (req.user.role === 'manager' && existing[0].status === 'completed' && value.status !== 'completed') return res.status(409).json({ success: false, message: 'Manager không thể mở lại dự án đã hoàn thành. Vui lòng liên hệ Admin.' });
        const effectiveManagerId = req.user.role === 'manager' ? existing[0].manager_id : value.manager_id;
        if (req.user.role === 'admin') {
            const [managers] = await db.query(`SELECT id FROM users WHERE id = ? AND role IN ('admin','manager') AND status = 'active' AND deleted_at IS NULL`, [effectiveManagerId]);
            if (!managers.length) return res.status(400).json({ success: false, message: 'Tài khoản quản lý không hợp lệ.' });
        }
        await db.query(`UPDATE projects SET name = ?, description = ?, location = ?, manager_id = ?, start_date = ?, end_date = ?, status = ? WHERE id = ?`, [value.name, value.description || null, value.location, effectiveManagerId, value.start_date, value.end_date, value.status || existing[0].status, req.params.id]);
        await db.query(`INSERT INTO activity_logs (user_id, action, description) VALUES (?, 'UPDATE_PROJECT', ?)`, [req.user.id, `Updated project #${req.params.id}; status: ${value.status || existing[0].status}`]);
        return res.json({ success: true, message: 'Cập nhật dự án thành công!' });
    } catch (error) { return respondServerError(res, error); }
};

exports.deleteProject = async (req, res) => {
    try {
        const [existing] = await db.query('SELECT id FROM projects WHERE id = ?', [req.params.id]);
        if (!existing.length) return res.status(404).json({ success: false, message: 'Không tìm thấy dự án!' });
        await db.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
        await db.query(`INSERT INTO activity_logs (user_id, action, description) VALUES (?, 'DELETE_PROJECT', ?)`, [req.user.id, `Deleted project #${req.params.id}`]);
        return res.json({ success: true, message: 'Xóa dự án thành công!' });
    } catch (error) { return respondServerError(res, error); }
};
