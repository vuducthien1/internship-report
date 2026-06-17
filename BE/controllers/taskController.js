const db = require('../config/db');
const { taskValidator } = require('../validations/taskValidation');

// 1. ADMIN/MANAGER GIAO VIỆC
exports.createTask = async (req, res) => {
    try {
        const { error } = taskValidator(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const { project_id, engineer_id, title, description } = req.body;

        // Kiểm tra xem user được gán có thực sự là Kỹ sư (engineer) không
        const [engineer] = await db.query('SELECT role FROM users WHERE id = ? AND deleted_at IS NULL', [engineer_id]);
        if (engineer.length === 0 || engineer[0].role !== 'engineer') {
            return res.status(400).json({ success: false, message: "ID này không tồn tại hoặc không phải là Kỹ sư!" });
        }

        // Lưu công việc vào database
        await db.query(
            'INSERT INTO tasks (project_id, engineer_id, title, description) VALUES (?, ?, ?, ?)',
            [project_id, engineer_id, title, description]
        );

        return res.status(201).json({ success: true, message: "✅ Giao việc thành công!" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2. KỸ SƯ XEM CÔNG VIỆC CỦA MÌNH
exports.getMyTasks = async (req, res) => {
    try {
        // Lấy ID của kỹ sư từ Token (đã được middleware giải mã)
        const engineer_id = req.user.id; 

        // Kết nối bảng tasks với bảng projects để lấy thêm tên Dự án cho dễ nhìn
        const [tasks] = await db.query(`
            SELECT t.*, p.name as project_name 
            FROM tasks t 
            JOIN projects p ON t.project_id = p.id 
            WHERE t.engineer_id = ?
            ORDER BY t.created_at DESC
        `, [engineer_id]);

        return res.status(200).json({ success: true, data: tasks });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};