# 🚀 Deployment Guide

This guide covers different deployment options for the Bulk Email Sender application, from simple VPS deployments to production-grade setups.

## Deployment Options

1. **VPS/Cloud Server** - Single server deployment
2. **Docker** - Containerized deployment
3. **PM2** - Process manager for Node.js
4. **Load Balanced** - High availability setup

## Prerequisites

### System Requirements

**Minimum (Small scale - up to 10k emails/day)**
- 2 CPU cores
- 4GB RAM
- 20GB storage
- Ubuntu 20.04+ or CentOS 8+

**Recommended (Medium scale - up to 100k emails/day)**
- 4 CPU cores
- 8GB RAM
- 50GB SSD storage
- Load balancer ready

**High Scale (1M+ emails/day)**
- 8+ CPU cores
- 16GB+ RAM
- 100GB+ SSD storage
- Database clustering
- Redis clustering

### Software Dependencies
- Node.js 18+
- MySQL 8.0+
- Redis 6.0+
- Nginx (reverse proxy)
- PM2 (process manager)

## VPS/Cloud Server Deployment

### 1. Server Setup

#### Initial Server Configuration
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git build-essential

# Create application user
sudo useradd -m -s /bin/bash bulkmail
sudo usermod -aG sudo bulkmail

# Switch to application user
sudo su - bulkmail
```

#### Install Node.js
```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Application Deployment

#### Clone and Setup
```bash
# Clone repository
cd /home/bulkmail
git clone https://github.com/your-repo/bulk_mail_sender.git
cd bulk_mail_sender

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Build frontend
cd frontend && npm run build && cd ..
```

#### Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

Set production values:
```env
NODE_ENV=production
PORT=3000
BASE_URL=https://yourdomain.com
DB_HOST=localhost
DB_USER=bulk_email_user
DB_PASSWORD=your_secure_password
REDIS_URL=redis://127.0.0.1:6379
# ... other configurations
```

### 3. Database Setup

```bash
# Install and configure MySQL
sudo apt install mysql-server
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p << 'EOF'
CREATE DATABASE bulk_email_sender CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bulk_email_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON bulk_email_sender.* TO 'bulk_email_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
EOF
```

### 4. Redis Setup

```bash
# Install Redis
sudo apt install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Key settings:
# maxmemory 512mb
# maxmemory-policy allkeys-lru
# requirepass your_redis_password

# Restart Redis
sudo systemctl restart redis-server
```

### 5. Process Manager (PM2)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'bulk-email-backend',
      script: 'backend/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/home/bulkmail/logs/err.log',
      out_file: '/home/bulkmail/logs/out.log',
      log_file: '/home/bulkmail/logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'frontend', 'logs']
    }
  ]
};
EOF

# Create logs directory
mkdir -p /home/bulkmail/logs

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Show application status
pm2 status
pm2 logs
```

### 6. Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/bulk-email-sender << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Serve frontend static files
    location / {
        root /home/bulkmail/bulk_mail_sender/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy tracking endpoints
    location /track {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/bulk-email-sender /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 7. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install snapd
sudo snap install --classic certbot

# Create symbolic link
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

## Docker Deployment

### 1. Create Dockerfile

```dockerfile
# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json backend/

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY backend/ backend/
COPY db/ db/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S bulkmail -u 1001

# Change ownership
RUN chown -R bulkmail:nodejs /app
USER bulkmail

EXPOSE 3000

CMD ["node", "backend/server.js"]
```

### 2. Frontend Dockerfile

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

# Production image
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

# Custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3. Docker Compose

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: bulk_email_sender
      MYSQL_USER: bulk_email_user
      MYSQL_PASSWORD: user_password
    volumes:
      - db_data:/var/lib/mysql
      - ./db/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "3306:3306"

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass redis_password
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  backend:
    build: 
      context: .
      dockerfile: Dockerfile.backend
    restart: always
    environment:
      NODE_ENV: production
      DB_HOST: db
      DB_USER: bulk_email_user
      DB_PASSWORD: user_password
      DB_NAME: bulk_email_sender
      REDIS_URL: redis://:redis_password@redis:6379
      PORT: 3000
    depends_on:
      - db
      - redis
    volumes:
      - ./uploads:/app/uploads
    ports:
      - "3000:3000"

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  db_data:
  redis_data:
```

### 4. Deploy with Docker

```bash
# Build and start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Scale backend if needed
docker-compose up -d --scale backend=3
```

## Load Balanced Deployment

### 1. Multiple Backend Instances

```javascript
// ecosystem.config.js for load balancing
module.exports = {
  apps: [
    {
      name: 'bulk-email-backend',
      script: 'backend/server.js',
      instances: 4, // or 'max' for CPU count
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
```

### 2. Nginx Load Balancer

```nginx
upstream backend {
    least_conn;
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 80;
    server_name yourdomain.com;

    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Sticky sessions for tracking
    location /track {
        proxy_pass http://backend;
        # Use ip_hash for consistent routing
        ip_hash;
    }
}
```

### 3. Database Clustering (Advanced)

```bash
# MySQL Master-Slave setup
# Master database configuration
[mysqld]
log-bin=mysql-bin
server-id=1
binlog-do-db=bulk_email_sender

# Slave database configuration
[mysqld]
server-id=2
replicate-do-db=bulk_email_sender
```

## Monitoring and Logging

### 1. Application Monitoring

```javascript
// Add to server.js
const express = require('express');
const app = express();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  const stats = await getQueueStats();
  res.json({
    queue: stats,
    system: {
      cpuUsage: process.cpuUsage(),
      memoryUsage: process.memoryUsage()
    }
  });
});
```

### 2. PM2 Monitoring

```bash
# Install PM2 monitoring
pm2 install pm2-server-monit

# Web monitoring interface
pm2 web

# Real-time monitoring
pm2 monit
```

### 3. Log Management

```bash
# Setup log rotation
sudo tee /etc/logrotate.d/bulk-email-sender << 'EOF'
/home/bulkmail/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF

# Test log rotation
sudo logrotate -d /etc/logrotate.d/bulk-email-sender
```

## Security Hardening

### 1. Firewall Configuration

```bash
# Install and configure UFW
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow necessary ports
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Show status
sudo ufw status verbose
```

### 2. Fail2Ban (Brute Force Protection)

```bash
# Install Fail2Ban
sudo apt install fail2ban

# Configure for Nginx
sudo tee /etc/fail2ban/jail.d/nginx.conf << 'EOF'
[nginx-req-limit]
enabled = true
filter = nginx-req-limit
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/error.log
findtime = 600
bantime = 7200
maxretry = 10
EOF
```

### 3. Security Updates

```bash
# Setup automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Configure automatic updates
echo 'Unattended-Upgrade::Automatic-Reboot "false";' | sudo tee -a /etc/apt/apt.conf.d/50unattended-upgrades
```

## Backup Strategy

### 1. Database Backup

```bash
# Create backup script
cat > /home/bulkmail/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/bulkmail/backups"
mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u bulk_email_user -p'password' bulk_email_sender | gzip > $BACKUP_DIR/db_${DATE}.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: $BACKUP_DIR/db_${DATE}.sql.gz"
EOF

chmod +x /home/bulkmail/backup-db.sh

# Schedule daily backup
crontab -e
# Add: 0 2 * * * /home/bulkmail/backup-db.sh
```

### 2. Application Backup

```bash
# Full application backup
cat > /home/bulkmail/backup-app.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/bulkmail/backups"

# Create application backup
tar -czf $BACKUP_DIR/app_${DATE}.tar.gz \
    --exclude=node_modules \
    --exclude=logs \
    --exclude=backups \
    /home/bulkmail/bulk_mail_sender/

echo "Application backup completed: $BACKUP_DIR/app_${DATE}.tar.gz"
EOF
```

## Troubleshooting Deployment

### Common Issues

**1. Port conflicts**
```bash
# Check port usage
sudo netstat -tlnp | grep :3000
sudo lsof -i :3000

# Kill process if needed
sudo kill -9 $(sudo lsof -t -i :3000)
```

**2. Permission issues**
```bash
# Fix ownership
sudo chown -R bulkmail:bulkmail /home/bulkmail/bulk_mail_sender

# Fix file permissions
find /home/bulkmail/bulk_mail_sender -type f -exec chmod 644 {} \;
find /home/bulkmail/bulk_mail_sender -type d -exec chmod 755 {} \;
```

**3. Database connection issues**
```bash
# Test database connection
mysql -h localhost -u bulk_email_user -p bulk_email_sender -e "SELECT 1"

# Check MySQL status
sudo systemctl status mysql
```

**4. Redis connection issues**
```bash
# Test Redis connection
redis-cli ping

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log
```

### Performance Troubleshooting

**1. High CPU usage**
```bash
# Monitor processes
htop
pm2 monit

# Check Node.js performance
node --prof backend/server.js
```

**2. Memory leaks**
```bash
# Monitor memory usage
pm2 logs --lines 200
free -h

# Restart if needed
pm2 restart all
```

**3. Database performance**
```sql
-- Check slow queries
SHOW PROCESSLIST;
SHOW FULL PROCESSLIST;

-- Analyze table performance
ANALYZE TABLE campaigns, contacts, campaign_recipients;
```

---

**Next Steps**: After deployment, see [Troubleshooting Guide](./troubleshooting.md) for maintenance and issue resolution.