const db = require('../config/db');
const { reportValidator } = require('../validations/reportValidation');

exports.createReport = async (req, res) => {
    try {
        const { error } = reportValidator(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const { task_id, content, status } = req.body;
        const engineer_id = req.user.id; // Lấy ID Kỹ sư từ Token

        // 1. Kiểm tra xem Task này có đúng là của Kỹ sư này không
        const [task] = await db.query('SELECT * FROM tasks WHERE id = ? AND engineer_id = ?', [task_id, engineer_id]);
        if (task.length === 0) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền báo cáo cho công việc này!" });
        }

        // 2. Lưu Báo cáo vào bảng reports
        await db.query(
            'INSERT INTO reports (task_id, engineer_id, content) VALUES (?, ?, ?)',
            [task_id, engineer_id, content]
        );

        // 3. Cập nhật trạng thái của Task
        await db.query(
            'UPDATE tasks SET status = ? WHERE id = ?',
            [status, task_id]
        );

        return res.status(201).json({ success: true, message: "✅ Gửi báo cáo thành công!" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};