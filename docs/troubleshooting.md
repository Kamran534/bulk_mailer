# 🔧 Troubleshooting Guide

This guide covers common issues, debugging techniques, and solutions for the Bulk Email Sender application.

## Quick Diagnostic Checklist

When experiencing issues, run through this checklist first:

```bash
# 1. Check service status
sudo systemctl status mysql redis-server nginx

# 2. Test basic connections
mysql -u bulk_email_user -p bulk_email_sender -e "SELECT 1"
redis-cli ping

# 3. Check application logs
pm2 logs
tail -f /var/log/nginx/error.log

# 4. Verify environment configuration
node -e "require('dotenv').config(); console.log(process.env.NODE_ENV, process.env.DB_HOST)"

# 5. Check available resources
free -h
df -h
top
```

## Application Issues

### 1. Application Won't Start

**Symptoms**: Process exits immediately, connection refused errors

**Common Causes & Solutions**:

**Missing dependencies**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for native module issues
npm rebuild
```

**Environment configuration errors**:
```bash
# Validate environment file
node -e "
require('dotenv').config();
const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'REDIS_URL'];
const missing = required.filter(key => !process.env[key]);
if (missing.length) {
  console.error('Missing variables:', missing);
  process.exit(1);
}
console.log('Environment OK');
"
```

**Port already in use**:
```bash
# Find process using port 3000
sudo lsof -i :3000
sudo netstat -tlnp | grep :3000

# Kill process if needed
sudo kill -9 $(sudo lsof -t -i :3000)
```

**Permission issues**:
```bash
# Fix ownership and permissions
sudo chown -R $USER:$USER /home/muhammad-kamran/Desktop/bulk_mail_sender
chmod -R 755 /home/muhammad-kamran/Desktop/bulk_mail_sender
```

### 2. Database Connection Issues

**Symptoms**: `Error: connect ECONNREFUSED`, `Access denied for user`

**MySQL not running**:
```bash
# Check MySQL status
sudo systemctl status mysql

# Start MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log
```

**Authentication errors**:
```bash
# Test database connection manually
mysql -h localhost -u bulk_email_user -p bulk_email_sender

# Reset user password if needed
sudo mysql -u root -p
mysql> ALTER USER 'bulk_email_user'@'localhost' IDENTIFIED BY 'new_password';
mysql> FLUSH PRIVILEGES;
```

**Database doesn't exist**:
```bash
# Create database
sudo mysql -u root -p -e "
CREATE DATABASE IF NOT EXISTS bulk_email_sender 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
"

# Initialize schema
mysql -u bulk_email_user -p bulk_email_sender < db/schema.sql
```

**Connection timeout**:
```bash
# Check MySQL configuration
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Add or modify:
[mysqld]
wait_timeout = 600
interactive_timeout = 600
max_connections = 100

# Restart MySQL
sudo systemctl restart mysql
```

### 3. Redis Connection Issues

**Symptoms**: `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Redis not running**:
```bash
# Check Redis status
sudo systemctl status redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test connection
redis-cli ping
```

**Redis configuration issues**:
```bash
# Check Redis configuration
sudo nano /etc/redis/redis.conf

# Common issues:
# - bind 127.0.0.1 (should allow localhost)
# - requirepass (if password is set, update .env)
# - maxmemory (should have enough memory)

# Restart Redis after changes
sudo systemctl restart redis-server
```

**Memory issues**:
```bash
# Check Redis memory usage
redis-cli info memory

# Clear Redis data if needed (careful!)
redis-cli flushall

# Or clear specific queue data
redis-cli del "bull:email queue:*"
```

### 4. Email Sending Issues

**Symptoms**: Emails not sending, authentication errors, rate limit errors

**SMTP authentication failures**:
```bash
# Test SMTP connection
node -e "
require('dotenv').config();
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
transporter.verify().then(console.log).catch(console.error);
"
```

**Gmail App Password issues**:
1. Ensure 2FA is enabled
2. Generate new App Password
3. Use 16-character password without spaces
4. Update SMTP_PASS in .env

**SendGrid issues**:
```bash
# Test SendGrid API key
curl -X GET \
  https://api.sendgrid.com/v3/user/profile \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Rate limiting**:
```bash
# Check queue status
redis-cli llen "bull:email queue:waiting"
redis-cli llen "bull:email queue:active"
redis-cli llen "bull:email queue:failed"

# Adjust rate limits in .env
EMAILS_PER_MINUTE=30  # Reduce if hitting limits
```

**Domain authentication**:
- Verify SPF, DKIM, and DMARC records
- Check sender domain is verified
- Use domain-authenticated email addresses

## Frontend Issues

### 1. React Application Errors

**Build failures**:
```bash
# Clear cache and rebuild
cd frontend
rm -rf node_modules package-lock.json build
npm install
npm run build

# Check for dependency conflicts
npm audit
npm audit fix
```

**Runtime errors**:
```bash
# Check browser console for errors
# Common issues:
# - API endpoint mismatches
# - CORS errors
# - Component state issues

# Enable React debugging
export NODE_ENV=development
npm start
```

**API connection issues**:
```javascript
// Check proxy configuration in frontend/package.json
"proxy": "http://localhost:3000"

// Or update API base URL in services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
```

### 2. CORS Issues

**Symptoms**: `blocked by CORS policy` errors in browser

**Backend CORS configuration**:
```javascript
// In backend/server.js
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3001',
    'https://yourdomain.com'
  ],
  credentials: true
}));
```

**Production CORS**:
```javascript
// For production deployment
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://yourdomain.com',
  credentials: true
}));
```

## Queue and Email Processing Issues

### 1. Queue Not Processing

**Symptoms**: Emails stuck in queue, no processing activity

**Check queue status**:
```bash
# Connect to Redis
redis-cli

# Check queue lengths
127.0.0.1:6379> LLEN "bull:email queue:waiting"
127.0.0.1:6379> LLEN "bull:email queue:active"
127.0.0.1:6379> LLEN "bull:email queue:completed"
127.0.0.1:6379> LLEN "bull:email queue:failed"
```

**Restart queue processing**:
```bash
# Restart application
pm2 restart all

# Or restart specific app
pm2 restart bulk-email-backend

# Check logs
pm2 logs
```

**Clear stuck jobs**:
```bash
# WARNING: This clears all queue data
redis-cli del "bull:email queue:active"
redis-cli del "bull:email queue:waiting"

# Or restart the entire queue system
redis-cli flushall  # DANGER: Clears all Redis data
```

### 2. High Failure Rate

**Check failed jobs**:
```bash
# View failed jobs
redis-cli lrange "bull:email queue:failed" 0 -1

# Get specific job details
redis-cli hgetall "bull:email queue:1"  # Replace 1 with job ID
```

**Common failure reasons**:
1. Invalid email addresses - clean contact list
2. Rate limiting - reduce EMAILS_PER_MINUTE
3. Provider authentication - check credentials
4. Content issues - avoid spam triggers

**Clean failed jobs**:
```bash
# Remove failed jobs (after analyzing the issues)
redis-cli del "bull:email queue:failed"
```

## Performance Issues

### 1. Slow Application Response

**Check system resources**:
```bash
# Monitor CPU and memory
htop
top

# Check disk usage
df -h
iostat -x 1

# Check MySQL performance
mysqladmin -u root -p processlist
```

**Database optimization**:
```sql
-- Check slow queries
SHOW FULL PROCESSLIST;

-- Optimize tables
OPTIMIZE TABLE contacts, campaigns, campaign_recipients, email_tracking;

-- Check index usage
EXPLAIN SELECT * FROM campaigns WHERE status = 'sending';
```

**Redis optimization**:
```bash
# Check Redis performance
redis-cli --latency
redis-cli info stats

# Monitor Redis memory
redis-cli info memory
```

### 2. Memory Leaks

**Monitor memory usage**:
```bash
# Check Node.js memory
pm2 monit

# Check system memory
free -h
watch -n 1 free -h
```

**Restart application if memory usage is high**:
```bash
# Restart with PM2
pm2 restart all

# Set memory limit in ecosystem.config.js
max_memory_restart: '1G'
```

## Network and Connectivity Issues

### 1. Nginx Issues

**Nginx not serving files**:
```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

**Proxy errors**:
```bash
# Check backend is running
curl http://localhost:3000/health

# Test proxy configuration
curl -H "Host: yourdomain.com" http://localhost/api/campaigns
```

**SSL certificate issues**:
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Test SSL
openssl s_client -connect yourdomain.com:443
```

### 2. Firewall Issues

**Check firewall rules**:
```bash
# UFW status
sudo ufw status verbose

# Allow necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

**Port connectivity test**:
```bash
# Test from external server
telnet yourdomain.com 80
telnet yourdomain.com 443

# Test local ports
netstat -tlnp | grep -E ':(80|443|3000|3306|6379)'
```

## Logging and Debugging

### 1. Enable Debug Logging

**Application debugging**:
```bash
# Set debug environment
export DEBUG=*
node backend/server.js

# Or specific modules
export DEBUG=express:*,bull:*
```

**Database debugging**:
```javascript
// Add to database.js
const pool = mysql.createPool({
  // ... existing config
  debug: process.env.NODE_ENV === 'development',
  acquireTimeout: 60000,
  timeout: 60000,
});
```

### 2. Log Collection

**Centralized logging**:
```bash
# Create log aggregation script
cat > collect-logs.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
LOG_DIR="/tmp/logs_${DATE}"
mkdir -p $LOG_DIR

# Application logs
pm2 logs --lines 100 > $LOG_DIR/pm2.log

# System logs
sudo journalctl -u mysql --lines=50 > $LOG_DIR/mysql.log
sudo journalctl -u redis-server --lines=50 > $LOG_DIR/redis.log
sudo journalctl -u nginx --lines=50 > $LOG_DIR/nginx.log

# System info
free -h > $LOG_DIR/memory.txt
df -h > $LOG_DIR/disk.txt
ps aux > $LOG_DIR/processes.txt

# Create archive
tar -czf logs_${DATE}.tar.gz -C /tmp logs_${DATE}/
echo "Logs collected: logs_${DATE}.tar.gz"
EOF

chmod +x collect-logs.sh
./collect-logs.sh
```

## Recovery Procedures

### 1. Database Recovery

**Restore from backup**:
```bash
# Stop application
pm2 stop all

# Restore database
mysql -u bulk_email_user -p bulk_email_sender < backup_20250814_120000.sql

# Restart application
pm2 start all
```

**Rebuild corrupted tables**:
```sql
-- Check table integrity
CHECK TABLE contacts, campaigns, campaign_recipients, email_tracking;

-- Repair if needed
REPAIR TABLE table_name;

-- Rebuild indexes
ALTER TABLE contacts DROP INDEX idx_email, ADD INDEX idx_email (email);
```

### 2. Redis Recovery

**Restore Redis data**:
```bash
# Stop Redis
sudo systemctl stop redis-server

# Restore RDB file
sudo cp backup_redis.rdb /var/lib/redis/dump.rdb
sudo chown redis:redis /var/lib/redis/dump.rdb

# Start Redis
sudo systemctl start redis-server
```

### 3. Complete System Recovery

**Emergency recovery steps**:
```bash
# 1. Stop all services
pm2 stop all
sudo systemctl stop nginx mysql redis-server

# 2. Backup current state
sudo cp -r /home/muhammad-kamran/Desktop/bulk_mail_sender /tmp/backup_current

# 3. Restore from known good backup
# ... restore database, redis, application code

# 4. Update configuration
# ... verify .env file, check credentials

# 5. Start services in order
sudo systemctl start mysql redis-server
pm2 start ecosystem.config.js
sudo systemctl start nginx

# 6. Verify functionality
curl http://localhost:3000/health
```

## Maintenance Tasks

### 1. Regular Maintenance

**Daily tasks**:
```bash
# Check service health
sudo systemctl status mysql redis-server nginx

# Monitor disk space
df -h

# Check for failed jobs
redis-cli llen "bull:email queue:failed"
```

**Weekly tasks**:
```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Analyze database tables
mysql -u bulk_email_user -p bulk_email_sender -e "
ANALYZE TABLE contacts, campaigns, campaign_recipients, email_tracking;
"

# Clean old log files
find /home/muhammad-kamran/logs -name "*.log" -mtime +30 -delete
```

**Monthly tasks**:
```bash
# Full system backup
./backup-db.sh
./backup-app.sh

# Check SSL certificate expiration
sudo certbot certificates

# Review and clean old campaigns/contacts if needed
```

### 2. Monitoring Setup

**Health check script**:
```bash
cat > health-check.sh << 'EOF'
#!/bin/bash
ERRORS=0

# Check services
services=("mysql" "redis-server" "nginx")
for service in "${services[@]}"; do
    if ! sudo systemctl is-active --quiet $service; then
        echo "ERROR: $service is not running"
        ((ERRORS++))
    fi
done

# Check application
if ! curl -s http://localhost:3000/health > /dev/null; then
    echo "ERROR: Application health check failed"
    ((ERRORS++))
fi

# Check queue processing
FAILED_JOBS=$(redis-cli llen "bull:email queue:failed")
if [ "$FAILED_JOBS" -gt 10 ]; then
    echo "WARNING: $FAILED_JOBS failed jobs in queue"
fi

if [ $ERRORS -eq 0 ]; then
    echo "All systems healthy"
fi

exit $ERRORS
EOF

chmod +x health-check.sh

# Schedule health checks
crontab -e
# Add: */5 * * * * /home/muhammad-kamran/health-check.sh >> /var/log/health-check.log
```

---

**Need more help?** Check the [API Reference](./api-reference.md) or review application logs for specific error messages.