const db = require('../config/db');
const { projectValidator } = require('../validations/projectValidation');

// 1. TẠO DỰ ÁN MỚI
exports.createProject = async (req, res) => {
    try {
        // Kiểm tra dữ liệu đầu vào
        const { error } = projectValidator(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const { name, description, location, manager_id, start_date, end_date } = req.body;

        // Kiểm tra xem ID của Quản lý có tồn tại và đúng là role 'manager' hoặc 'admin' không
        const [manager] = await db.query(
            'SELECT id, role FROM users WHERE id = ? AND deleted_at IS NULL', 
            [manager_id]
        );
        
        if (manager.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản Quản lý này trên hệ thống!" });
        }
        if (manager[0].role === 'engineer') {
            return res.status(400).json({ success: false, message: "Kỹ sư không đủ thẩm quyền để làm Quản lý dự án!" });
        }

        // Lưu dự án vào Database
        await db.query(
            'INSERT INTO projects (name, description, location, manager_id, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description, location, manager_id, start_date, end_date]
        );

        return res.status(201).json({ success: true, message: "Tạo dự án mới thành công!" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2. LẤY DANH SÁCH DỰ ÁN (Có kèm tên Quản lý)
exports.getAllProjects = async (req, res) => {
    try {
        // Dùng lệnh JOIN để lấy fullname từ bảng users dựa vào manager_id
        const [projects] = await db.query(`
            SELECT p.*, u.fullname as manager_name 
            FROM projects p 
            JOIN users u ON p.manager_id = u.id
            ORDER BY p.created_at DESC
        `);
        
        return res.status(200).json({ success: true, data: projects });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};