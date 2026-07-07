const db = require('../config/db');
const { taskValidator, taskManagerUpdateValidator } = require('../validations/taskValidation');
const respondServerError = require('../utils/respondServerError');
const createNotification = require('../utils/createNotification');
const { taskUpdateValidator } = require('../validations/operationValidation');

exports.getTasks = async (req, res) => {
    try {
        let query = `
            SELECT t.*, p.name AS project_name, u.fullname AS engineer_name
            FROM tasks t
            JOIN projects p ON t.project_id = p.id
            JOIN users u ON t.engineer_id = u.id
        `;
        const params = [];
        if (req.user.role === 'manager') {
            query += ' WHERE p.manager_id = ?';
            params.push(req.user.id);
        }
        query += ' ORDER BY t.created_at DESC';
        const [tasks] = await db.query(query, params);
        return res.status(200).json({ success: true, data: tasks });
    } catch (error) {
        return respondServerError(res, error);
    }
};

// 1. ADMIN/MANAGER GIAO VIỆC
exports.createTask = async (req, res) => {
    let connection;
    try {
        const { error, value } = taskValidator(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const { project_id, engineer_id, title, description, due_date, priority, checklist } = value;
        connection = await db.getConnection();
        await connection.beginTransaction();

        let projectQuery = 'SELECT id, name FROM projects WHERE id = ?';
        const projectParams = [project_id];
        if (req.user.role === 'manager') {
            projectQuery += ' AND manager_id = ?';
            projectParams.push(req.user.id);
        }

        const [projects] = await connection.query(projectQuery, projectParams);
        if (!projects.length) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: 'Dự án không tồn tại hoặc không thuộc quyền quản lý của bạn.',
            });
        }

        // Kiểm tra xem user được gán có thực sự là Kỹ sư (engineer) không
        const [engineer] = await connection.query(
            `SELECT role FROM users
             WHERE id = ? AND status = 'active' AND deleted_at IS NULL`,
            [engineer_id]
        );
        if (engineer.length === 0 || engineer[0].role !== 'engineer') {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "ID này không tồn tại hoặc không phải là Kỹ sư!" });
        }

        // Lưu công việc vào database
        const [result] = await connection.query(
            `INSERT INTO tasks
             (project_id, engineer_id, title, description, due_date, priority)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [project_id, engineer_id, title, description, due_date || null, priority || 'medium']
        );

        if (checklist.length) {
            const values = checklist.map((item, index) => [result.insertId, item, index]);
            await connection.query(
                'INSERT INTO task_checklist_items (task_id, title, sort_order) VALUES ?',
                [values]
            );
        }

        await connection.query(
            `INSERT INTO task_updates (task_id, user_id, event_type, message)
             VALUES (?, ?, 'created', ?)`,
            [result.insertId, req.user.id, `Công việc được giao cho kỹ sư #${engineer_id}`]
        );

        await connection.query(
            `INSERT INTO activity_logs (user_id, action, description)
             VALUES (?, 'ASSIGN_TASK', ?)`,
            [req.user.id, `Assigned task #${result.insertId} to user #${engineer_id}`]
        );
        await connection.commit();
        await createNotification(req.app, {
            userId: engineer_id,
            title: 'Bạn có công việc mới',
            message: `${title} — ${projects[0].name}`,
            type: 'task',
            link: '/engineer/tasks',
            push: true,
        }).catch(() => {});

        return res.status(201).json({ success: true, message: "✅ Giao việc thành công!" });
    } catch (error) {
        if (connection) await connection.rollback().catch(() => {});
        return respondServerError(res, error);
    } finally {
        connection?.release();
    }
};

// 2. KỸ SƯ XEM CÔNG VIỆC CỦA MÌNH
exports.getMyTasks = async (req, res) => {
    try {
        // Lấy ID của kỹ sư từ Token (đã được middleware giải mã)
        const engineer_id = req.user.id; 

        // Kết nối bảng tasks với bảng projects để lấy thêm tên Dự án cho dễ nhìn
        const [tasks] = await db.query(`
            SELECT t.*, p.name as project_name, u.fullname as engineer_name,
                   EXISTS(
                       SELECT 1 FROM reports r
                       WHERE r.task_id = t.id AND r.engineer_id = t.engineer_id
                         AND r.approval_status = 'pending'
                   ) AS has_pending_report
            FROM tasks t 
            JOIN projects p ON t.project_id = p.id 
            JOIN users u ON t.engineer_id = u.id
            WHERE t.engineer_id = ?
            ORDER BY t.created_at DESC
        `, [engineer_id]);

        return res.status(200).json({ success: true, data: tasks });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.updateTask = async (req, res) => {
    let connection;
    try {
        const taskId = Number(req.params.id);
        const { error, value } = taskManagerUpdateValidator(req.body);
        if (!Number.isInteger(taskId) || taskId <= 0 || error) return res.status(400).json({ success: false, message: error?.details[0]?.message || 'Công việc không hợp lệ.' });
        connection = await db.getConnection();
        await connection.beginTransaction();
        let query = `SELECT t.*, p.manager_id, p.name AS project_name FROM tasks t JOIN projects p ON p.id = t.project_id WHERE t.id = ?`;
        const params = [taskId];
        if (req.user.role === 'manager') { query += ' AND p.manager_id = ?'; params.push(req.user.id); }
        query += ' FOR UPDATE';
        const [rows] = await connection.query(query, params);
        if (!rows.length) { await connection.rollback(); return res.status(404).json({ success: false, message: 'Không tìm thấy công việc hoặc bạn không có quyền chỉnh sửa.' }); }
        const current = rows[0];
        if (value.status === 'completed' && current.status !== 'completed') { await connection.rollback(); return res.status(409).json({ success: false, message: 'Công việc chỉ được hoàn thành qua quy trình duyệt báo cáo.' }); }
        if (current.status === 'completed' && value.status !== 'completed' && req.user.role === 'manager') { await connection.rollback(); return res.status(409).json({ success: false, message: 'Manager không thể mở lại công việc đã hoàn thành.' }); }
        const [engineers] = await connection.query(`SELECT id, fullname FROM users WHERE id = ? AND role = 'engineer' AND status = 'active' AND deleted_at IS NULL`, [value.engineer_id]);
        if (!engineers.length) { await connection.rollback(); return res.status(400).json({ success: false, message: 'Kỹ sư được chọn không hợp lệ hoặc không hoạt động.' }); }
        await connection.query(`UPDATE tasks SET engineer_id = ?, title = ?, description = ?, due_date = ?, priority = ?, status = ? WHERE id = ?`, [value.engineer_id, value.title, value.description || null, value.due_date || null, value.priority, value.status, taskId]);
        const changes = [];
        if (Number(current.engineer_id) !== Number(value.engineer_id)) changes.push(`chuyển cho ${engineers[0].fullname}`);
        if (current.status !== value.status) changes.push(`trạng thái ${current.status} → ${value.status}`);
        if (current.priority !== value.priority) changes.push(`ưu tiên ${current.priority} → ${value.priority}`);
        const oldDue = current.due_date ? new Date(current.due_date).toISOString().slice(0, 10) : '';
        const newDue = value.due_date ? new Date(value.due_date).toISOString().slice(0, 10) : '';
        if (oldDue !== newDue) changes.push(`hạn ${oldDue || 'trống'} → ${newDue || 'trống'}`);
        if (current.title !== value.title || (current.description || '') !== (value.description || '')) changes.push('cập nhật nội dung');
        await connection.query(`INSERT INTO task_updates (task_id, user_id, event_type, message) VALUES (?, ?, 'manager_update', ?)`, [taskId, req.user.id, `${changes.join('; ') || 'Cập nhật công việc'}. Lý do: ${value.change_reason}`]);
        await connection.query(`INSERT INTO activity_logs (user_id, action, description) VALUES (?, 'MANAGER_UPDATE_TASK', ?)`, [req.user.id, `Updated task #${taskId}: ${changes.join('; ') || 'metadata'}`]);
        await connection.commit();
        await createNotification(req.app, { userId: value.engineer_id, title: 'Công việc đã được cập nhật', message: `${value.title} — ${value.change_reason}`, type: 'task', link: '/engineer/tasks' }).catch(() => {});
        if (Number(current.engineer_id) !== Number(value.engineer_id)) await createNotification(req.app, { userId: current.engineer_id, title: 'Công việc đã được chuyển giao', message: `${current.title} — ${value.change_reason}`, type: 'info', link: '/engineer/tasks' }).catch(() => {});
        return res.json({ success: true, message: 'Đã cập nhật công việc và ghi vào dòng thời gian.' });
    } catch (error) {
        if (connection) await connection.rollback().catch(() => {});
        return respondServerError(res, error);
    } finally { connection?.release(); }
};

exports.getEngineerDashboard = async (req, res) => {
    try {
        const engineerId = req.user.id;
        const [[taskCounts], [pendingReports], [openRequests], [openIncidents], [upcomingTasks]] = await Promise.all([
            db.query(`
                SELECT COUNT(*) AS total,
                       SUM(status = 'pending') AS pending,
                       SUM(status = 'in_progress') AS in_progress,
                       SUM(status = 'completed') AS completed,
                       SUM(status IN ('pending', 'in_progress', 'on_hold') AND due_date < CURDATE()) AS overdue,
                       SUM(status IN ('pending', 'in_progress', 'on_hold') AND due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)) AS due_soon
                FROM tasks WHERE engineer_id = ?`, [engineerId]),
            db.query("SELECT COUNT(*) AS total FROM reports WHERE engineer_id = ? AND approval_status = 'pending'", [engineerId]),
            db.query("SELECT COUNT(*) AS total FROM task_requests WHERE engineer_id = ? AND status = 'pending'", [engineerId]),
            db.query("SELECT COUNT(*) AS total FROM safety_incidents WHERE engineer_id = ? AND status <> 'resolved'", [engineerId]),
            db.query(`
                SELECT t.id, t.title, t.status, t.priority, t.due_date, p.name AS project_name
                FROM tasks t JOIN projects p ON p.id = t.project_id
                WHERE t.engineer_id = ? AND t.status IN ('pending', 'in_progress', 'on_hold')
                ORDER BY t.due_date IS NULL, t.due_date ASC, t.priority DESC LIMIT 6`, [engineerId]),
        ]);
        return res.json({
            success: true,
            data: {
                tasks: {
                    total: Number(taskCounts[0].total || 0),
                    pending: Number(taskCounts[0].pending || 0),
                    in_progress: Number(taskCounts[0].in_progress || 0),
                    completed: Number(taskCounts[0].completed || 0),
                    overdue: Number(taskCounts[0].overdue || 0),
                    due_soon: Number(taskCounts[0].due_soon || 0),
                },
                pending_reports: Number(pendingReports[0].total || 0),
                open_requests: Number(openRequests[0].total || 0),
                open_incidents: Number(openIncidents[0].total || 0),
                upcoming_tasks: upcomingTasks,
            },
        });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.getTaskDetails = async (req, res) => {
    try {
        const taskId = Number(req.params.id);
        if (!Number.isInteger(taskId) || taskId <= 0) return res.status(400).json({ success: false, message: 'Công việc không hợp lệ.' });
        let query = `
            SELECT t.*, p.name AS project_name, p.location AS project_location,
                   engineer.fullname AS engineer_name, manager.fullname AS manager_name
            FROM tasks t
            JOIN projects p ON p.id = t.project_id
            JOIN users engineer ON engineer.id = t.engineer_id
            JOIN users manager ON manager.id = p.manager_id
            WHERE t.id = ?`;
        const params = [taskId];
        if (req.user.role === 'engineer') { query += ' AND t.engineer_id = ?'; params.push(req.user.id); }
        if (req.user.role === 'manager') { query += ' AND p.manager_id = ?'; params.push(req.user.id); }
        const [tasks] = await db.query(query, params);
        if (!tasks.length) return res.status(404).json({ success: false, message: 'Không tìm thấy công việc hoặc bạn không có quyền truy cập.' });

        const [[checklist], [reports], [updates], [requests]] = await Promise.all([
            db.query('SELECT id, title, sort_order, is_completed, completed_at FROM task_checklist_items WHERE task_id = ? ORDER BY sort_order, id', [taskId]),
            db.query('SELECT id, content, approval_status, proposed_status, created_at, reviewed_at FROM reports WHERE task_id = ? ORDER BY created_at DESC', [taskId]),
            db.query(`SELECT tu.id, tu.event_type, tu.message, tu.created_at, u.fullname AS user_name
                      FROM task_updates tu LEFT JOIN users u ON u.id = tu.user_id
                      WHERE tu.task_id = ? ORDER BY tu.created_at DESC LIMIT 50`, [taskId]),
            db.query('SELECT id, request_type, requested_due_date, reason, status, review_note, created_at, reviewed_at FROM task_requests WHERE task_id = ? ORDER BY created_at DESC', [taskId]),
        ]);
        return res.json({ success: true, data: { task: tasks[0], checklist, reports, updates, requests } });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.addTaskUpdate = async (req, res) => {
    try {
        const taskId = Number(req.params.id);
        const { error, value } = taskUpdateValidator(req.body);
        if (!Number.isInteger(taskId) || taskId <= 0 || error) return res.status(400).json({ success: false, message: error?.details[0]?.message || 'Công việc không hợp lệ.' });
        const [access] = await db.query('SELECT id FROM tasks WHERE id = ? AND engineer_id = ?', [taskId, req.user.id]);
        if (!access.length) return res.status(403).json({ success: false, message: 'Bạn không có quyền cập nhật công việc này.' });
        await db.query("INSERT INTO task_updates (task_id, user_id, event_type, message) VALUES (?, ?, 'note', ?)", [taskId, req.user.id, value.message]);
        return res.status(201).json({ success: true, message: 'Đã thêm cập nhật công việc.' });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.getTaskChecklist = async (req, res) => {
    try {
        const taskId = Number(req.params.id);
        if (!Number.isInteger(taskId) || taskId <= 0) {
            return res.status(400).json({ success: false, message: 'Công việc không hợp lệ.' });
        }
        let accessQuery = `
            SELECT t.id FROM tasks t
            JOIN projects p ON p.id = t.project_id
            WHERE t.id = ?
        `;
        const params = [taskId];
        if (req.user.role === 'engineer') {
            accessQuery += ' AND t.engineer_id = ?';
            params.push(req.user.id);
        } else if (req.user.role === 'manager') {
            accessQuery += ' AND p.manager_id = ?';
            params.push(req.user.id);
        }
        const [access] = await db.query(accessQuery, params);
        if (!access.length) return res.status(403).json({ success: false, message: 'Bạn không có quyền xem checklist này.' });

        const [items] = await db.query(
            `SELECT id, task_id, title, sort_order, is_completed, completed_at
             FROM task_checklist_items
             WHERE task_id = ? ORDER BY sort_order, id`,
            [taskId]
        );
        return res.json({ success: true, data: items });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.updateTaskChecklist = async (req, res) => {
    let connection;
    try {
        const taskId = Number(req.params.id);
        const items = req.body.items;
        const validItems = Array.isArray(items)
            && items.length > 0
            && items.length <= 100
            && items.every((item) => Number.isInteger(Number(item.id)) && typeof item.completed === 'boolean');
        const itemIds = validItems ? items.map((item) => Number(item.id)) : [];
        if (!Number.isInteger(taskId) || taskId <= 0 || !validItems || new Set(itemIds).size !== itemIds.length) {
            return res.status(400).json({ success: false, message: 'Dữ liệu checklist không hợp lệ.' });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();
        const [tasks] = await connection.query(
            'SELECT id FROM tasks WHERE id = ? AND engineer_id = ? FOR UPDATE',
            [taskId, req.user.id]
        );
        if (!tasks.length) {
            await connection.rollback();
            return res.status(403).json({ success: false, message: 'Bạn không có quyền cập nhật checklist này.' });
        }

        const [currentItems] = await connection.query(
            `SELECT id, title, is_completed
             FROM task_checklist_items
             WHERE task_id = ? ORDER BY sort_order, id FOR UPDATE`,
            [taskId]
        );
        const currentIds = new Set(currentItems.map((item) => Number(item.id)));
        if (currentItems.length !== items.length || itemIds.some((id) => !currentIds.has(id))) {
            await connection.rollback();
            return res.status(409).json({ success: false, message: 'Checklist vừa thay đổi. Vui lòng mở lại và thử lần nữa.' });
        }

        const desiredById = new Map(items.map((item) => [Number(item.id), item.completed]));
        const changedItems = currentItems.filter((item) => Boolean(item.is_completed) !== desiredById.get(Number(item.id)));
        for (const item of changedItems) {
            const completed = desiredById.get(Number(item.id));
            await connection.query(
                `UPDATE task_checklist_items
                 SET is_completed = ?, completed_by = ?, completed_at = ${completed ? 'NOW()' : 'NULL'}
                 WHERE id = ? AND task_id = ?`,
                [completed ? 1 : 0, completed ? req.user.id : null, item.id, taskId]
            );
        }

        const completedCount = items.filter((item) => item.completed).length;
        if (changedItems.length) {
            await connection.query(
                `INSERT INTO activity_logs (user_id, action, description)
                 VALUES (?, 'UPDATE_TASK_CHECKLIST', ?)`,
                [req.user.id, `Saved ${changedItems.length} checklist changes for task #${taskId}`]
            );
            await connection.query(
                `INSERT INTO task_updates (task_id, user_id, event_type, message)
                 VALUES (?, ?, 'checklist', ?)`,
                [taskId, req.user.id, `Đã lưu checklist nghiệm thu: ${completedCount}/${items.length} hạng mục hoàn thành`]
            );
        }
        await connection.commit();
        return res.json({
            success: true,
            message: changedItems.length ? 'Đã lưu checklist nghiệm thu.' : 'Checklist không có thay đổi.',
            data: { completed_count: completedCount, total: items.length, changed_count: changedItems.length },
        });
    } catch (error) {
        if (connection) await connection.rollback().catch(() => {});
        return respondServerError(res, error);
    } finally {
        if (connection) connection.release();
    }
};

exports.updateChecklistItem = async (req, res) => {
    try {
        const taskId = Number(req.params.id);
        const itemId = Number(req.params.itemId);
        const completed = req.body.completed;
        if (!Number.isInteger(taskId) || !Number.isInteger(itemId) || typeof completed !== 'boolean') {
            return res.status(400).json({ success: false, message: 'Dữ liệu checklist không hợp lệ.' });
        }
        const [items] = await db.query(
            `SELECT ci.id
             FROM task_checklist_items ci
             JOIN tasks t ON t.id = ci.task_id
             WHERE ci.id = ? AND ci.task_id = ? AND t.engineer_id = ?`,
            [itemId, taskId, req.user.id]
        );
        if (!items.length) return res.status(403).json({ success: false, message: 'Bạn không có quyền cập nhật mục này.' });

        await db.query(
            `UPDATE task_checklist_items
             SET is_completed = ?, completed_by = ?, completed_at = ${completed ? 'NOW()' : 'NULL'}
             WHERE id = ?`,
            [completed ? 1 : 0, completed ? req.user.id : null, itemId]
        );
        await db.query(
            `INSERT INTO activity_logs (user_id, action, description)
             VALUES (?, 'UPDATE_TASK_CHECKLIST', ?)`,
            [req.user.id, `${completed ? 'Completed' : 'Reopened'} checklist item #${itemId} of task #${taskId}`]
        );
        await db.query(
            `INSERT INTO task_updates (task_id, user_id, event_type, message)
             VALUES (?, ?, 'checklist', ?)`,
            [taskId, req.user.id, `${completed ? 'Hoàn thành' : 'Mở lại'} mục checklist #${itemId}`]
        );
        return res.json({ success: true, message: 'Đã cập nhật checklist.' });
    } catch (error) {
        return respondServerError(res, error);
    }
};
