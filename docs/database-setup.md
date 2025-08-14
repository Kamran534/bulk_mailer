# 📊 Database Setup Guide

This guide covers complete MySQL database setup for the Bulk Email Sender application.

## Prerequisites

- MySQL 8.0 or higher
- Administrative access to MySQL server
- Basic knowledge of SQL commands

## Installation

### Ubuntu/Debian
```bash
# Update package list
sudo apt update

# Install MySQL Server
sudo apt install mysql-server

# Start MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure MySQL installation
sudo mysql_secure_installation
```

### CentOS/RHEL/Fedora
```bash
# Install MySQL Server
sudo dnf install mysql-server  # Fedora
sudo yum install mysql-server  # CentOS/RHEL

# Start MySQL service
sudo systemctl start mysqld
sudo systemctl enable mysqld

# Get temporary root password
sudo grep 'temporary password' /var/log/mysqld.log

# Secure MySQL installation
sudo mysql_secure_installation
```

### macOS
```bash
# Using Homebrew
brew install mysql

# Start MySQL service
brew services start mysql

# Secure installation
mysql_secure_installation
```

### Windows
1. Download MySQL Installer from [MySQL Official Website](https://dev.mysql.com/downloads/installer/)
2. Run the installer and choose "Server only" or "Full" installation
3. Follow the setup wizard
4. Set root password during installation

## Database Configuration

### 1. Create Database and User

Connect to MySQL as root:
```bash
mysql -u root -p
```

Create the database and user:
```sql
-- Create database
CREATE DATABASE bulk_email_sender CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create dedicated user (recommended for production)
CREATE USER 'bulk_email_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON bulk_email_sender.* TO 'bulk_email_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify database creation
SHOW DATABASES;

-- Exit MySQL
EXIT;
```

### 2. Initialize Database Schema

Option 1: **Automatic initialization** (recommended)
```bash
# The application will create tables automatically on first run
cd /home/muhammad-kamran/Desktop/bulk_mail_sender
npm start
```

Option 2: **Manual schema creation**
```bash
# Import schema manually
mysql -u bulk_email_user -p bulk_email_sender < db/schema.sql
```

### 3. Verify Schema Creation

```sql
-- Connect to database
mysql -u bulk_email_user -p bulk_email_sender

-- List all tables
SHOW TABLES;

-- Check table structure
DESCRIBE contacts;
DESCRIBE campaigns;
DESCRIBE campaign_recipients;
DESCRIBE email_tracking;
```

Expected tables:
- `contacts` - Subscriber/recipient information
- `campaigns` - Email campaign metadata
- `campaign_recipients` - Many-to-many relationship with tracking
- `email_tracking` - Detailed event tracking (opens, clicks, etc.)

## Environment Configuration

Update your `.env` file with database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=bulk_email_user
DB_PASSWORD=your_secure_password_here
DB_NAME=bulk_email_sender
```

## Performance Optimization

### 1. MySQL Configuration

Edit MySQL configuration file:

**Ubuntu/Debian**: `/etc/mysql/mysql.conf.d/mysqld.cnf`  
**CentOS/RHEL**: `/etc/my.cnf`  
**macOS**: `/opt/homebrew/etc/my.cnf`

Add these optimizations:
```ini
[mysqld]
# Basic settings
max_connections = 100
innodb_buffer_pool_size = 512M
innodb_log_file_size = 128M

# Performance optimizations
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT
query_cache_type = 1
query_cache_size = 32M

# Character set
character_set_server = utf8mb4
collation_server = utf8mb4_unicode_ci
```

### 2. Index Optimization

The schema includes these important indexes:
```sql
-- Contacts table indexes
INDEX idx_email (email)
INDEX idx_status (status)

-- Campaigns table indexes  
INDEX idx_status (status)
INDEX idx_scheduled_at (scheduled_at)

-- Campaign recipients indexes
INDEX idx_campaign_id (campaign_id)
INDEX idx_contact_id (contact_id) 
INDEX idx_tracking_id (tracking_id)
INDEX idx_status (status)

-- Email tracking indexes
INDEX idx_tracking_id (tracking_id)
INDEX idx_event_type (event_type)
INDEX idx_timestamp (timestamp)
```

## Backup and Maintenance

### 1. Database Backup

**Full backup**:
```bash
# Create backup
mysqldump -u bulk_email_user -p bulk_email_sender > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
mysql -u bulk_email_user -p bulk_email_sender < backup_20250814_120000.sql
```

**Automated daily backup**:
```bash
# Create backup script
cat > /home/muhammad-kamran/backup_db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u bulk_email_user -p'your_password' bulk_email_sender > /backups/bulk_email_${DATE}.sql
# Keep only last 7 days
find /backups -name "bulk_email_*.sql" -mtime +7 -delete
EOF

# Make executable
chmod +x /home/muhammad-kamran/backup_db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/muhammad-kamran/backup_db.sh
```

### 2. Database Maintenance

**Regular maintenance tasks**:
```sql
-- Analyze tables for query optimization
ANALYZE TABLE contacts, campaigns, campaign_recipients, email_tracking;

-- Optimize tables
OPTIMIZE TABLE contacts, campaigns, campaign_recipients, email_tracking;

-- Check table status
SHOW TABLE STATUS FROM bulk_email_sender;
```

## Security Best Practices

### 1. Database Security

```sql
-- Remove anonymous users
DELETE FROM mysql.user WHERE User='';

-- Remove remote root access
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');

-- Remove test database
DROP DATABASE IF EXISTS test;

-- Reload privilege tables
FLUSH PRIVILEGES;
```

### 2. User Permissions

```sql
-- Create read-only user for reporting
CREATE USER 'bulk_email_reader'@'localhost' IDENTIFIED BY 'readonly_password';
GRANT SELECT ON bulk_email_sender.* TO 'bulk_email_reader'@'localhost';

-- Create backup user
CREATE USER 'bulk_email_backup'@'localhost' IDENTIFIED BY 'backup_password';
GRANT SELECT, LOCK TABLES ON bulk_email_sender.* TO 'bulk_email_backup'@'localhost';

FLUSH PRIVILEGES;
```

### 3. Connection Security

```ini
# In my.cnf
[mysqld]
# Require SSL connections
require_secure_transport = ON

# Bind to specific interface only
bind-address = 127.0.0.1
```

## Troubleshooting

### Common Issues

**1. Connection refused**
```bash
# Check if MySQL is running
sudo systemctl status mysql

# Start MySQL if stopped
sudo systemctl start mysql

# Check MySQL error logs
sudo tail -f /var/log/mysql/error.log
```

**2. Access denied errors**
```sql
-- Reset user password
ALTER USER 'bulk_email_user'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

**3. Database connection timeout**
```ini
# Increase timeout in my.cnf
[mysqld]
wait_timeout = 600
interactive_timeout = 600
```

**4. Table doesn't exist errors**
```bash
# Reinitialize database schema
mysql -u bulk_email_user -p bulk_email_sender < db/schema.sql
```

### Performance Issues

**1. Slow queries**
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;

-- Check slow queries
SHOW PROCESSLIST;
```

**2. High memory usage**
```ini
# Adjust buffer sizes in my.cnf
[mysqld]
innodb_buffer_pool_size = 256M  # Reduce if low memory
key_buffer_size = 32M
```

## Testing Connection

Test your database setup:

```bash
# Test connection
mysql -u bulk_email_user -p bulk_email_sender -e "SELECT 'Database connection successful' as status;"

# Test application connection
cd /home/muhammad-kamran/Desktop/bulk_mail_sender
node -e "
require('dotenv').config();
const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
connection.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  console.log('Database connection successful!');
  connection.end();
});
"
```

---

**Next Steps**: After completing database setup, proceed to [Redis Setup](./redis-setup.md)