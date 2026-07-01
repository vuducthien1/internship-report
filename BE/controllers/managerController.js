const db = require('../config/db');
const respondServerError = require('../utils/respondServerError');

const managerId = (req) => req.user.id;

exports.getDashboard = async (req, res) => {
    try {
        const id = managerId(req);
        const [projects, tasks, pendingReports, pendingRequests, incidents, projectProgress, workload, overdueTasks] = await Promise.all([
            db.query(`SELECT COUNT(*) AS total, SUM(status = 'ongoing') AS ongoing FROM projects WHERE manager_id = ?`, [id]),
            db.query(`SELECT COUNT(*) AS total,
                             SUM(t.status IN ('pending','in_progress','on_hold')) AS active,
                             SUM(t.status = 'completed') AS completed,
                             SUM(t.status IN ('pending','in_progress','on_hold') AND t.due_date < CURDATE()) AS overdue,
                             SUM(t.status IN ('pending','in_progress','on_hold') AND t.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)) AS due_soon
                      FROM tasks t JOIN projects p ON p.id = t.project_id WHERE p.manager_id = ?`, [id]),
            db.query(`SELECT COUNT(*) AS total FROM reports r JOIN tasks t ON t.id = r.task_id JOIN projects p ON p.id = t.project_id WHERE p.manager_id = ? AND r.approval_status = 'pending'`, [id]),
            db.query(`SELECT COUNT(*) AS total FROM task_requests tr JOIN tasks t ON t.id = tr.task_id JOIN projects p ON p.id = t.project_id WHERE p.manager_id = ? AND tr.status = 'pending'`, [id]),
            db.query(`SELECT COUNT(*) AS total, SUM(i.severity IN ('high','critical') AND i.status <> 'resolved') AS urgent FROM safety_incidents i JOIN projects p ON p.id = i.project_id WHERE p.manager_id = ? AND i.status <> 'resolved'`, [id]),
            db.query(`SELECT p.id, p.name, p.status, p.end_date, COUNT(t.id) AS task_total,
                             SUM(t.status = 'completed') AS task_completed,
                             ROUND(COALESCE(100 * SUM(t.status = 'completed') / NULLIF(COUNT(t.id), 0), 0)) AS progress
                      FROM projects p LEFT JOIN tasks t ON t.project_id = p.id
                      WHERE p.manager_id = ? GROUP BY p.id ORDER BY p.updated_at DESC`, [id]),
            db.query(`SELECT u.id, u.fullname, u.employee_code,
                             COUNT(t.id) AS task_total,
                             SUM(t.status IN ('pending','in_progress','on_hold')) AS active,
                             SUM(t.status IN ('pending','in_progress','on_hold') AND t.due_date < CURDATE()) AS overdue,
                             SUM(t.status IN ('pending','in_progress','on_hold') AND t.priority IN ('urgent','critical')) AS urgent
                      FROM users u JOIN tasks t ON t.engineer_id = u.id JOIN projects p ON p.id = t.project_id
                      WHERE p.manager_id = ? GROUP BY u.id ORDER BY active DESC, overdue DESC`, [id]),
            db.query(`SELECT t.id, t.title, t.status, t.priority, t.due_date, p.name AS project_name, u.fullname AS engineer_name
                      FROM tasks t JOIN projects p ON p.id = t.project_id JOIN users u ON u.id = t.engineer_id
                      WHERE p.manager_id = ? AND t.status IN ('pending','in_progress','on_hold') AND t.due_date < CURDATE()
                      ORDER BY t.due_date ASC LIMIT 8`, [id]),
        ]);
        const projectCounts = projects[0][0];
        const taskCounts = tasks[0][0];
        return res.json({
            success: true,
            data: {
                projects: { total: Number(projectCounts.total || 0), ongoing: Number(projectCounts.ongoing || 0) },
                tasks: Object.fromEntries(Object.entries(taskCounts).map(([key, value]) => [key, Number(value || 0)])),
                pending_reports: Number(pendingReports[0][0].total || 0),
                pending_requests: Number(pendingRequests[0][0].total || 0),
                open_incidents: Number(incidents[0][0].total || 0),
                urgent_incidents: Number(incidents[0][0].urgent || 0),
                project_progress: projectProgress[0],
                workload: workload[0],
                overdue_tasks: overdueTasks[0],
            },
        });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.getKpis = async (req, res) => {
    try {
        const id = managerId(req);
        const [summaryRows, projects, engineers] = await Promise.all([
            db.query(`SELECT COUNT(DISTINCT t.id) AS tasks,
                             COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) AS completed,
                             COUNT(DISTINCT CASE WHEN t.status IN ('pending','in_progress','on_hold') AND t.due_date < CURDATE() THEN t.id END) AS overdue,
                             COUNT(DISTINCT r.id) AS reports,
                             COUNT(DISTINCT CASE WHEN r.approval_status = 'approved' THEN r.id END) AS approved_reports,
                             ROUND(AVG(CASE WHEN r.reviewed_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, r.created_at, r.reviewed_at) END) / 60, 1) AS avg_review_hours
                      FROM projects p LEFT JOIN tasks t ON t.project_id = p.id LEFT JOIN reports r ON r.task_id = t.id
                      WHERE p.manager_id = ?`, [id]),
            db.query(`SELECT p.id, p.name, COUNT(t.id) AS tasks,
                             SUM(t.status = 'completed') AS completed,
                             SUM(t.status IN ('pending','in_progress','on_hold') AND t.due_date < CURDATE()) AS overdue,
                             ROUND(COALESCE(100 * SUM(t.status = 'completed') / NULLIF(COUNT(t.id), 0), 0)) AS completion_rate,
                             (SELECT COUNT(*) FROM safety_incidents i WHERE i.project_id = p.id AND i.status <> 'resolved') AS open_incidents
                      FROM projects p LEFT JOIN tasks t ON t.project_id = p.id
                      WHERE p.manager_id = ? GROUP BY p.id ORDER BY completion_rate ASC, overdue DESC`, [id]),
            db.query(`SELECT u.id, u.fullname, COUNT(t.id) AS tasks,
                             SUM(t.status = 'completed') AS completed,
                             SUM(t.status IN ('pending','in_progress','on_hold') AND t.due_date < CURDATE()) AS overdue,
                             ROUND(COALESCE(100 * SUM(t.status = 'completed') / NULLIF(COUNT(t.id), 0), 0)) AS completion_rate
                      FROM users u JOIN tasks t ON t.engineer_id = u.id JOIN projects p ON p.id = t.project_id
                      WHERE p.manager_id = ? GROUP BY u.id ORDER BY overdue DESC, completion_rate ASC`, [id]),
        ]);
        return res.json({ success: true, data: { summary: summaryRows[0][0], projects: projects[0], engineers: engineers[0] } });
    } catch (error) {
        return respondServerError(res, error);
    }
};
