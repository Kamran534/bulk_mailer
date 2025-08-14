const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bulk_email_sender',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

const initializeDatabase = async () => {
  try {
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        status ENUM('active', 'unsubscribed', 'bounced') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_status (status)
      )
    `);

    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        html_content TEXT,
        text_content TEXT,
        from_email VARCHAR(255) NOT NULL,
        from_name VARCHAR(255),
        status ENUM('draft', 'scheduled', 'sending', 'sent', 'paused') DEFAULT 'draft',
        scheduled_at DATETIME,
        sent_at DATETIME,
        total_recipients INT DEFAULT 0,
        sent_count INT DEFAULT 0,
        opened_count INT DEFAULT 0,
        clicked_count INT DEFAULT 0,
        bounced_count INT DEFAULT 0,
        unsubscribed_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_scheduled_at (scheduled_at)
      )
    `);

    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS campaign_recipients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        campaign_id INT NOT NULL,
        contact_id INT NOT NULL,
        status ENUM('pending', 'sent', 'failed', 'bounced') DEFAULT 'pending',
        sent_at DATETIME,
        opened_at DATETIME,
        clicked_at DATETIME,
        tracking_id VARCHAR(36) UNIQUE,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
        UNIQUE KEY unique_campaign_contact (campaign_id, contact_id),
        INDEX idx_campaign_id (campaign_id),
        INDEX idx_contact_id (contact_id),
        INDEX idx_tracking_id (tracking_id),
        INDEX idx_status (status)
      )
    `);

    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS email_tracking (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tracking_id VARCHAR(36) NOT NULL,
        event_type ENUM('open', 'click', 'bounce', 'unsubscribe') NOT NULL,
        url VARCHAR(500),
        ip_address VARCHAR(45),
        user_agent TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tracking_id (tracking_id),
        INDEX idx_event_type (event_type),
        INDEX idx_timestamp (timestamp)
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

module.exports = { pool: promisePool, initializeDatabase };