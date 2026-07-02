const db = require('./db');

const initCoreSchema = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            fullname VARCHAR(80) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            phone VARCHAR(15) NULL,
            password VARCHAR(255) NOT NULL,
            avatar_url VARCHAR(500) NULL,
            role ENUM('admin','engineer','manager') NOT NULL DEFAULT 'engineer',
            status ENUM('pending','active','inactive','suspended') NOT NULL DEFAULT 'pending',
            refresh_token TEXT NULL,
            employee_code VARCHAR(50) NULL,
            department VARCHAR(120) NULL,
            job_title VARCHAR(120) NULL,
            bio VARCHAR(500) NULL,
            email_verified_at TIMESTAMP NULL,
            verification_token_hash CHAR(64) NULL,
            verification_expires_at DATETIME NULL,
            reset_token_hash CHAR(64) NULL,
            reset_expires_at DATETIME NULL,
            deleted_by INT NULL,
            deletion_reason VARCHAR(1000) NULL,
            cognito_sub VARCHAR(100) NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS projects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT NULL,
            location VARCHAR(255) NOT NULL,
            manager_id INT NOT NULL,
            status ENUM('planning','ongoing','completed') DEFAULT 'planning',
            start_date DATE NULL,
            end_date DATE NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_projects_manager (manager_id),
            FOREIGN KEY (manager_id) REFERENCES users(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            project_id INT NOT NULL,
            engineer_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT NULL,
            status ENUM('pending','in_progress','completed','on_hold','cancelled') DEFAULT 'pending',
            due_date DATE NULL,
            priority ENUM('low','medium','high','urgent','critical') DEFAULT 'medium',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tasks_project (project_id),
            INDEX idx_tasks_engineer (engineer_id),
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (engineer_id) REFERENCES users(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            engineer_id INT NOT NULL,
            content TEXT NOT NULL,
            media_url VARCHAR(500) NULL,
            report_type ENUM('manual','voice','mixed') DEFAULT 'manual',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_reports_task (task_id),
            INDEX idx_reports_engineer (engineer_id),
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
            FOREIGN KEY (engineer_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS report_attachments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            report_id INT NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_url VARCHAR(500) NOT NULL,
            file_type ENUM('image','video','audio','document') NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_report_attachments_report (report_id),
            FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS voice_records (
            id INT AUTO_INCREMENT PRIMARY KEY,
            report_id INT NOT NULL,
            audio_url VARCHAR(500) NOT NULL,
            transcript LONGTEXT NULL,
            duration_seconds INT DEFAULT 0,
            language_code VARCHAR(20) DEFAULT 'vi-VN',
            status ENUM('uploaded','processing','completed','failed') DEFAULT 'uploaded',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_voice_records_report (report_id),
            FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS user_profiles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL UNIQUE,
            bio TEXT NULL,
            specialization VARCHAR(255) NULL,
            certification VARCHAR(255) NULL,
            experience_years INT DEFAULT 0,
            skills TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS user_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL UNIQUE,
            theme ENUM('light','dark') DEFAULT 'light',
            language ENUM('vi','en') DEFAULT 'vi',
            email_notification TINYINT(1) DEFAULT 1,
            push_notification TINYINT(1) DEFAULT 1,
            voice_auto_transcribe TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
};

module.exports = initCoreSchema;
