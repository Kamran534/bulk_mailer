-- Bulk Email Sender Database Schema

CREATE DATABASE IF NOT EXISTS bulk_email_sender;
USE bulk_email_sender;

-- Contacts table
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
);

-- Campaigns table
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
);

-- Campaign recipients table (many-to-many relationship)
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
);

-- Email tracking events table
CREATE TABLE IF NOT EXISTS email_tracking (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tracking_id VARCHAR(36) NOT NULL,
  event_type ENUM('open', 'click', 'bounce', 'unsubscribe') NOT NULL,
  url VARCHAR(500), -- For click tracking
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tracking_id (tracking_id),
  INDEX idx_event_type (event_type),
  INDEX idx_timestamp (timestamp)
);

-- Sample data (optional)
INSERT INTO contacts (email, first_name, last_name) VALUES
('john.doe@example.com', 'John', 'Doe'),
('jane.smith@example.com', 'Jane', 'Smith'),
('bob.wilson@example.com', 'Bob', 'Wilson');

-- Create user for application (optional)
-- CREATE USER 'bulk_email_user'@'localhost' IDENTIFIED BY 'secure_password';
-- GRANT ALL PRIVILEGES ON bulk_email_sender.* TO 'bulk_email_user'@'localhost';
-- FLUSH PRIVILEGES;