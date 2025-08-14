# 🚀 Redis Setup Guide

This guide covers complete Redis setup for the Bulk Email Sender application's queue management system.

## Prerequisites

- Redis 6.0 or higher
- Administrative access to install packages
- Basic knowledge of Redis commands

## What Redis Does in This Application

Redis powers the email queue system using the Bull library:
- **Job Queue**: Manages email sending jobs with rate limiting
- **Rate Limiting**: Controls email sending speed to avoid provider limits
- **Retry Logic**: Handles failed email attempts with exponential backoff
- **Job Tracking**: Monitors email sending progress and status

## Installation

### Ubuntu/Debian
```bash
# Update package list
sudo apt update

# Install Redis Server
sudo apt install redis-server

# Start Redis service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify installation
redis-cli --version
```

### CentOS/RHEL/Fedora
```bash
# Enable EPEL repository (CentOS/RHEL)
sudo yum install epel-release  # CentOS/RHEL
sudo dnf install redis         # Fedora

# Start Redis service
sudo systemctl start redis
sudo systemctl enable redis

# Verify installation
redis-cli --version
```

### macOS
```bash
# Using Homebrew
brew install redis

# Start Redis service
brew services start redis

# Verify installation
redis-cli --version
```

### Windows
```bash
# Using WSL (recommended) or Windows Subsystem for Linux
# Follow Ubuntu instructions above

# Alternative: Redis on Windows (not recommended for production)
# Download from: https://github.com/microsoftarchive/redis/releases
```

### Docker (Cross-platform)
```bash
# Run Redis in Docker container
docker run -d \
  --name redis-bulk-email \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:7-alpine \
  redis-server --appendonly yes

# Verify Redis is running
docker exec -it redis-bulk-email redis-cli ping
```

## Configuration

### 1. Basic Redis Configuration

Edit Redis configuration file:

**Ubuntu/Debian**: `/etc/redis/redis.conf`  
**CentOS/RHEL**: `/etc/redis.conf`  
**macOS**: `/opt/homebrew/etc/redis.conf`

Key settings for the application:
```ini
# Network settings
bind 127.0.0.1
port 6379
timeout 300

# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence (recommended for job queue)
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec

# Security
requirepass your_redis_password_here

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log
```

### 2. Production Security Settings

```ini
# Security enhancements
requirepass "your_strong_redis_password"
rename-command FLUSHDB "FLUSH_DB_SECURE_NAME"
rename-command FLUSHALL "FLUSH_ALL_SECURE_NAME"
rename-command CONFIG "CONFIG_SECURE_NAME"
rename-command DEBUG ""

# Network security
protected-mode yes
bind 127.0.0.1
port 6379
tcp-backlog 511
```

### 3. Performance Optimization

```ini
# Memory optimization
maxmemory 512mb
maxmemory-policy volatile-lru

# I/O optimization
tcp-keepalive 300
tcp-nodelay yes

# Background saving
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
```

## Environment Configuration

Update your `.env` file:

```env
# Redis Configuration
REDIS_URL=redis://127.0.0.1:6379

# With password
REDIS_URL=redis://:your_password@127.0.0.1:6379

# With custom options
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=your_password
```

## Testing Redis Installation

### 1. Basic Connection Test

```bash
# Test Redis connection
redis-cli ping
# Expected output: PONG

# Test with password
redis-cli -a your_password ping
# Expected output: PONG
```

### 2. Queue Functionality Test

```bash
# Connect to Redis CLI
redis-cli

# Test basic operations
127.0.0.1:6379> SET test_key "Hello Redis"
127.0.0.1:6379> GET test_key
127.0.0.1:6379> DEL test_key
127.0.0.1:6379> EXIT
```

### 3. Application Connection Test

Create a test script:
```bash
cd /home/muhammad-kamran/Desktop/bulk_mail_sender
node -e "
require('dotenv').config();
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

client.on('error', (err) => {
  console.error('Redis connection error:', err);
  process.exit(1);
});

client.connect().then(() => {
  console.log('Redis connection successful!');
  return client.ping();
}).then((result) => {
  console.log('Redis ping result:', result);
  client.disconnect();
}).catch((err) => {
  console.error('Redis test failed:', err);
  process.exit(1);
});
"
```

## Queue Management

### 1. Monitor Queue Status

```bash
# Connect to Redis CLI
redis-cli

# View all keys (queue data)
127.0.0.1:6379> KEYS *

# Check queue stats
127.0.0.1:6379> LLEN bull:email queue:waiting
127.0.0.1:6379> LLEN bull:email queue:active
127.0.0.1:6379> LLEN bull:email queue:completed
127.0.0.1:6379> LLEN bull:email queue:failed
```

### 2. Queue Operations

```bash
# View waiting jobs
127.0.0.1:6379> LRANGE bull:email queue:waiting 0 -1

# Clear failed jobs (be careful!)
127.0.0.1:6379> DEL bull:email queue:failed

# View job details
127.0.0.1:6379> HGETALL bull:email queue:1  # Job ID 1
```

### 3. Application Queue Monitoring

The application provides queue stats through the API:
```bash
# Check queue status via API
curl http://localhost:3000/api/queue/stats

# Expected response:
# {
#   "waiting": 0,
#   "active": 2,
#   "completed": 156,
#   "failed": 3
# }
```

## Performance Tuning

### 1. Memory Optimization

Monitor memory usage:
```bash
# Check Redis memory usage
redis-cli info memory

# Key metrics to monitor:
# - used_memory_human
# - used_memory_peak_human
# - maxmemory_human
```

Optimize memory settings:
```ini
# In redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru  # Remove least recently used keys
maxmemory-samples 5
```

### 2. Persistence Tuning

For email queue (balance between performance and reliability):
```ini
# Faster saves, less data loss risk
save 300 10    # Save every 5 minutes if at least 10 keys changed
save 60 1000   # Save every minute if at least 1000 keys changed

# Enable AOF for better durability
appendonly yes
appendfsync everysec  # Good balance of performance/safety
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
```

### 3. Connection Pool Settings

In your application, optimize Redis connections:
```javascript
// Example connection pool settings
const client = redis.createClient({
  url: process.env.REDIS_URL,
  socket: {
    keepAlive: 30000,
    connectTimeout: 60000,
    commandTimeout: 5000
  },
  retry_strategy: (options) => {
    if (options.error?.code === 'ECONNREFUSED') {
      return new Error('Redis server refused connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});
```

## Monitoring and Maintenance

### 1. Health Monitoring

Create a monitoring script:
```bash
cat > /home/muhammad-kamran/monitor_redis.sh << 'EOF'
#!/bin/bash

# Check if Redis is running
if ! systemctl is-active --quiet redis-server; then
    echo "ALERT: Redis is not running!"
    sudo systemctl start redis-server
fi

# Check memory usage
MEMORY_USAGE=$(redis-cli info memory | grep used_memory_peak_perc | cut -d: -f2)
if (( $(echo "$MEMORY_USAGE > 90" | bc -l) )); then
    echo "WARNING: Redis memory usage is ${MEMORY_USAGE}%"
fi

# Check for failed jobs
FAILED_JOBS=$(redis-cli LLEN "bull:email queue:failed")
if [ "$FAILED_JOBS" -gt 0 ]; then
    echo "WARNING: $FAILED_JOBS failed email jobs in queue"
fi

echo "Redis health check completed at $(date)"
EOF

chmod +x /home/muhammad-kamran/monitor_redis.sh

# Add to crontab (every 5 minutes)
crontab -e
# Add: */5 * * * * /home/muhammad-kamran/monitor_redis.sh >> /var/log/redis-monitor.log
```

### 2. Log Rotation

```bash
# Create logrotate config
sudo tee /etc/logrotate.d/redis << 'EOF'
/var/log/redis/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 640 redis redis
    postrotate
        systemctl reload redis-server
    endscript
}
EOF
```

### 3. Backup Strategy

Redis data backup:
```bash
# Create backup script
cat > /home/muhammad-kamran/backup_redis.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/redis"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup Redis data
redis-cli --rdb $BACKUP_DIR/redis_backup_${DATE}.rdb
redis-cli LASTSAVE > $BACKUP_DIR/redis_lastsave_${DATE}.txt

# Compress backup
gzip $BACKUP_DIR/redis_backup_${DATE}.rdb

# Clean old backups (keep 7 days)
find $BACKUP_DIR -name "redis_backup_*.rdb.gz" -mtime +7 -delete
find $BACKUP_DIR -name "redis_lastsave_*.txt" -mtime +7 -delete

echo "Redis backup completed: $BACKUP_DIR/redis_backup_${DATE}.rdb.gz"
EOF

chmod +x /home/muhammad-kamran/backup_redis.sh

# Schedule daily backup at 3 AM
crontab -e
# Add: 0 3 * * * /home/muhammad-kamran/backup_redis.sh
```

## Troubleshooting

### Common Issues

**1. Redis connection refused**
```bash
# Check if Redis is running
sudo systemctl status redis-server

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log

# Restart Redis if needed
sudo systemctl restart redis-server
```

**2. Memory issues**
```bash
# Check memory usage
redis-cli info memory

# Clear specific data (be careful!)
redis-cli FLUSHDB  # Clear current database
redis-cli FLUSHALL # Clear all databases (dangerous!)

# Or selectively clean old job data
redis-cli EVAL "
local keys = redis.call('keys', 'bull:email queue:completed:*')
for i=1,#keys do
    redis.call('del', keys[i])
end
return #keys
" 0
```

**3. Queue stuck or frozen**
```bash
# Check for stuck active jobs
redis-cli LLEN "bull:email queue:active"
redis-cli LRANGE "bull:email queue:active" 0 -1

# Clean stuck jobs (restart application first!)
redis-cli DEL "bull:email queue:active"
```

**4. Performance issues**
```bash
# Monitor Redis operations
redis-cli --latency

# Check slow operations
redis-cli CONFIG SET slowlog-log-slower-than 10000
redis-cli SLOWLOG GET 10
```

### Application Integration Issues

**1. Queue not processing jobs**
```javascript
// Debug queue connection in application
const Queue = require('bull');
const emailQueue = new Queue('email queue', {
  redis: { port: 6379, host: '127.0.0.1' }
});

emailQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

emailQueue.on('ready', () => {
  console.log('Queue is ready');
});
```

**2. Jobs failing repeatedly**
```bash
# Check failed jobs
redis-cli LRANGE "bull:email queue:failed" 0 -1

# Get specific job details
redis-cli HGETALL "bull:email queue:job_id"
```

## Security Checklist

- [ ] Redis password configured (`requirepass`)
- [ ] Redis bound to localhost only (`bind 127.0.0.1`)
- [ ] Dangerous commands renamed or disabled
- [ ] Protected mode enabled (`protected-mode yes`)
- [ ] Regular security updates applied
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery tested

---

**Next Steps**: After completing Redis setup, proceed to [Email Provider Setup](./email-provider-setup.md)