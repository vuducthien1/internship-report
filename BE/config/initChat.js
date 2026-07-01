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

const initChatTables = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS chat_conversations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user1_id INT NOT NULL,
            user2_id INT NOT NULL,
            is_locked TINYINT(1) DEFAULT 0,
            locked_by INT NULL,
            locked_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_pair (user1_id, user2_id),
            FOREIGN KEY (user1_id) REFERENCES users(id),
            FOREIGN KEY (user2_id) REFERENCES users(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            conversation_id INT NOT NULL,
            sender_id INT NOT NULL,
            message_type ENUM('text', 'voice', 'image', 'file') DEFAULT 'text',
            content TEXT,
            voice_url VARCHAR(500),
            file_url VARCHAR(500),
            file_name VARCHAR(255),
            file_size BIGINT UNSIGNED,
            file_mime VARCHAR(150),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id),
            FOREIGN KEY (sender_id) REFERENCES users(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.query(`
        ALTER TABLE chat_messages
        MODIFY COLUMN message_type ENUM('text', 'voice', 'image', 'file') DEFAULT 'text'
    `);
    await ensureColumn('chat_messages', 'file_url', 'VARCHAR(500) NULL');
    await ensureColumn('chat_messages', 'file_name', 'VARCHAR(255) NULL');
    await ensureColumn('chat_messages', 'file_size', 'BIGINT UNSIGNED NULL');
    await ensureColumn('chat_messages', 'file_mime', 'VARCHAR(150) NULL');
};

module.exports = initChatTables;
