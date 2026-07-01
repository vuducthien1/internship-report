const db = require('./db');

const ensureColumn = async (table, column, definition) => {
    const [rows] = await db.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
    );
    if (!rows.length) {
        await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    }
};

const initApplication = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            migration_key VARCHAR(120) PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            action VARCHAR(80) NOT NULL,
            description TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_activity_user (user_id),
            INDEX idx_activity_created (created_at),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(180) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(40) DEFAULT 'info',
            link VARCHAR(255) NULL,
            is_read TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_notification_user_read (user_id, is_read, created_at),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS task_checklist_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            sort_order INT DEFAULT 0,
            is_completed TINYINT(1) DEFAULT 0,
            completed_by INT NULL,
            completed_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_checklist_task (task_id, sort_order),
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
            FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await ensureColumn('notifications', 'title', 'VARCHAR(180) NOT NULL');
    await ensureColumn('notifications', 'message', 'TEXT NOT NULL');
    await ensureColumn('notifications', 'type', "VARCHAR(40) DEFAULT 'info'");
    await ensureColumn('notifications', 'link', 'VARCHAR(255) NULL');
    await ensureColumn('notifications', 'is_read', 'TINYINT(1) DEFAULT 0');
    await ensureColumn('notifications', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    await ensureColumn('users', 'employee_code', 'VARCHAR(50) NULL');
    await ensureColumn('users', 'department', 'VARCHAR(120) NULL');
    await ensureColumn('users', 'job_title', 'VARCHAR(120) NULL');
    await ensureColumn('users', 'bio', 'VARCHAR(500) NULL');
    await ensureColumn('users', 'avatar_url', 'VARCHAR(500) NULL');
    await ensureColumn('users', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    await ensureColumn('users', 'email_verified_at', 'TIMESTAMP NULL');
    await ensureColumn('users', 'verification_token_hash', 'CHAR(64) NULL');
    await ensureColumn('users', 'verification_expires_at', 'DATETIME NULL');
    await ensureColumn('users', 'reset_token_hash', 'CHAR(64) NULL');
    await ensureColumn('users', 'reset_expires_at', 'DATETIME NULL');
    await ensureColumn('users', 'deleted_at', 'TIMESTAMP NULL');
    await ensureColumn('users', 'deleted_by', 'INT NULL');
    await ensureColumn('users', 'deletion_reason', 'VARCHAR(1000) NULL');

    const userApprovalMigration = 'user_approval_and_email_verification_v1';
    const [userApprovalApplied] = await db.query(
        'SELECT migration_key FROM schema_migrations WHERE migration_key = ?',
        [userApprovalMigration]
    );
    if (!userApprovalApplied.length) {
        await db.query(`
            ALTER TABLE users
            MODIFY COLUMN status ENUM('pending', 'active', 'inactive', 'suspended')
            NOT NULL DEFAULT 'pending'
        `);
        await db.query(`
            UPDATE users
            SET email_verified_at = COALESCE(email_verified_at, created_at, NOW())
            WHERE status <> 'pending'
        `);
        await db.query('INSERT INTO schema_migrations (migration_key) VALUES (?)', [userApprovalMigration]);
    }

    await db.query(`
        CREATE TABLE IF NOT EXISTS email_outbox (
            id INT AUTO_INCREMENT PRIMARY KEY,
            recipient VARCHAR(255) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            text_content TEXT NOT NULL,
            status ENUM('queued', 'sent', 'failed') DEFAULT 'queued',
            error_message VARCHAR(500) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sent_at TIMESTAMP NULL,
            INDEX idx_email_outbox_status (status, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS contact_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            fullname VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(20) NULL,
            company VARCHAR(150) NULL,
            message TEXT NOT NULL,
            status ENUM('new', 'processing', 'resolved') DEFAULT 'new',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_contact_status_created (status, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS task_updates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            user_id INT NULL,
            event_type VARCHAR(50) NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_task_updates_task (task_id, created_at),
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS task_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            engineer_id INT NOT NULL,
            request_type ENUM('extension', 'blocker') NOT NULL,
            requested_due_date DATE NULL,
            reason TEXT NOT NULL,
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            review_note VARCHAR(500) NULL,
            reviewed_by INT NULL,
            reviewed_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_task_requests_task_status (task_id, status, created_at),
            INDEX idx_task_requests_engineer (engineer_id, created_at),
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
            FOREIGN KEY (engineer_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS safety_incidents (
            id INT AUTO_INCREMENT PRIMARY KEY,
            project_id INT NOT NULL,
            task_id INT NULL,
            engineer_id INT NOT NULL,
            title VARCHAR(180) NOT NULL,
            description TEXT NOT NULL,
            severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
            location_text VARCHAR(255) NULL,
            latitude DECIMAL(10,7) NULL,
            longitude DECIMAL(10,7) NULL,
            image_url VARCHAR(500) NULL,
            status ENUM('open', 'investigating', 'resolved') DEFAULT 'open',
            resolved_by INT NULL,
            resolved_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_incidents_project_status (project_id, status, created_at),
            INDEX idx_incidents_engineer (engineer_id, created_at),
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
            FOREIGN KEY (engineer_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS project_documents (
            id INT AUTO_INCREMENT PRIMARY KEY,
            project_id INT NOT NULL,
            group_id INT NULL,
            title VARCHAR(180) NOT NULL,
            version INT NOT NULL DEFAULT 1,
            file_path VARCHAR(500) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            mime_type VARCHAR(150) NOT NULL,
            file_size BIGINT NOT NULL,
            uploaded_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_documents_project_title (project_id, title, version),
            INDEX idx_documents_group_version (group_id, version),
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS manager_assignments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            manager_id INT NOT NULL,
            project_id INT NULL,
            assigned_by INT NULL,
            title VARCHAR(180) NOT NULL,
            description TEXT NOT NULL,
            due_date DATE NULL,
            priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
            status ENUM('assigned', 'accepted', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'assigned',
            progress_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
            manager_note VARCHAR(1000) NULL,
            cancel_reason VARCHAR(500) NULL,
            accepted_at TIMESTAMP NULL,
            completed_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_manager_assignments_manager_status (manager_id, status, due_date),
            INDEX idx_manager_assignments_project (project_id),
            INDEX idx_manager_assignments_assigner (assigned_by),
            FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE RESTRICT,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
            FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS user_deletion_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            target_user_id INT NOT NULL,
            requested_by INT NULL,
            reviewed_by INT NULL,
            request_type ENUM('manager_request', 'admin_direct') NOT NULL DEFAULT 'manager_request',
            reason VARCHAR(1000) NOT NULL,
            status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
            review_note VARCHAR(1000) NULL,
            reviewed_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_deletion_requests_status_created (status, created_at),
            INDEX idx_deletion_requests_target (target_user_id, status),
            INDEX idx_deletion_requests_requester (requested_by, created_at),
            FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE RESTRICT,
            FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await ensureColumn('reports', 'work_quantity', 'VARCHAR(255) NULL');
    await ensureColumn('reports', 'blockers', 'TEXT NULL');
    await ensureColumn('reports', 'safety_notes', 'TEXT NULL');
    await ensureColumn('reports', 'next_plan', 'TEXT NULL');
    await ensureColumn('reports', 'proposed_status', "ENUM('in_progress', 'completed') DEFAULT 'in_progress'");
    await ensureColumn('reports', 'approval_status', "ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'");
    await ensureColumn('reports', 'reviewed_by', 'INT NULL');
    await ensureColumn('reports', 'reviewed_at', 'TIMESTAMP NULL');
    await ensureColumn('reports', 'review_note', 'VARCHAR(500) NULL');
    await ensureColumn('safety_incidents', 'assigned_to', 'INT NULL');
    await ensureColumn('safety_incidents', 'root_cause', 'TEXT NULL');
    await ensureColumn('safety_incidents', 'corrective_action', 'TEXT NULL');
    await ensureColumn('safety_incidents', 'target_resolution_date', 'DATE NULL');
    await ensureColumn('safety_incidents', 'resolution_image_url', 'VARCHAR(500) NULL');
    await ensureColumn('email_outbox', 'provider', "VARCHAR(30) DEFAULT 'local'");

    const migrationKey = 'reports_approval_workflow_v1';
    const [applied] = await db.query(
        'SELECT migration_key FROM schema_migrations WHERE migration_key = ?',
        [migrationKey]
    );
    if (!applied.length) {
        await db.query(`
            UPDATE reports r
            JOIN tasks t ON t.id = r.task_id
            SET r.approval_status = 'approved',
                r.proposed_status = CASE WHEN t.status = 'completed' THEN 'completed' ELSE 'in_progress' END,
                r.reviewed_at = r.created_at
            WHERE r.approval_status = 'pending'
        `);
        await db.query('INSERT INTO schema_migrations (migration_key) VALUES (?)', [migrationKey]);
    }
};

module.exports = initApplication;
