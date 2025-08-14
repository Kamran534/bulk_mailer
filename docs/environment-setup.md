# 🌍 Environment Configuration Guide

This guide covers complete environment setup for the Bulk Email Sender application, including all configuration variables and their purposes.

## Environment Files

The application uses environment variables for configuration. These should be stored in a `.env` file in the project root.

### File Structure
```
bulk_mail_sender/
├── .env                 # Your configuration (never commit!)
├── .env.example         # Template with example values
└── docs/
    └── environment-setup.md # This guide
```

## Complete Environment Configuration

### 1. Create Environment File

```bash
# Copy example file
cp .env.example .env

# Edit with your settings
nano .env
```

### 2. Configuration Categories

#### Database Configuration
```env
# MySQL Database Settings
DB_HOST=localhost                    # Database host
DB_USER=bulk_email_user             # Database username
DB_PASSWORD=your_secure_password    # Database password
DB_NAME=bulk_email_sender           # Database name
```

#### Redis Configuration
```env
# Redis Settings (for queue management)
REDIS_URL=redis://127.0.0.1:6379   # Redis connection URL

# Alternative format (if using individual settings)
REDIS_HOST=127.0.0.1                # Redis host
REDIS_PORT=6379                     # Redis port
REDIS_PASSWORD=                     # Redis password (if set)
```

#### Email Provider Configuration

**Choose ONE of the following options:**

**Option 1: SMTP (Gmail, Outlook, etc.)**
```env
SMTP_HOST=smtp.gmail.com            # SMTP server host
SMTP_PORT=587                       # SMTP port (587 for TLS, 465 for SSL)
SMTP_SECURE=false                   # Use SSL/TLS (false for STARTTLS)
SMTP_USER=your_email@gmail.com      # SMTP username
SMTP_PASS=your_app_password         # SMTP password (use App Password for Gmail)
```

**Option 2: SendGrid**
```env
SENDGRID_API_KEY=SG.your_api_key_here   # SendGrid API key
```

**Option 3: Amazon SES**
```env
AWS_ACCESS_KEY_ID=your_access_key       # AWS Access Key ID
AWS_SECRET_ACCESS_KEY=your_secret_key   # AWS Secret Access Key
AWS_REGION=us-east-1                    # AWS region
```

#### Application Settings
```env
# Server Configuration
PORT=3000                           # Backend server port
NODE_ENV=development                # Environment (development/production)

# Security
JWT_SECRET=your_jwt_secret_key      # JWT signing secret (generate random)

# URLs and Tracking
BASE_URL=http://localhost:3000      # Base URL for tracking links
TRACKING_PIXEL_URL=http://localhost:3000/track/open    # Open tracking URL
CLICK_TRACKING_URL=http://localhost:3000/track/click   # Click tracking URL
```

#### Rate Limiting & Performance
```env
# Email Sending Limits
EMAILS_PER_MINUTE=60               # Max emails per minute
EMAILS_PER_HOUR=1000              # Max emails per hour

# Queue Settings (optional - defaults provided)
QUEUE_CONCURRENCY=5               # Number of concurrent email jobs
QUEUE_DELAY=1000                  # Delay between jobs (milliseconds)
```

### 3. Production Environment Configuration

For production deployment:

```env
# Production Database (consider using connection pooling)
DB_HOST=your-database-server.com
DB_USER=bulk_email_prod_user
DB_PASSWORD=very_secure_production_password
DB_NAME=bulk_email_sender_prod

# Production Redis (consider Redis clusters for high availability)
REDIS_URL=redis://redis-cluster.example.com:6379

# Production Application Settings
NODE_ENV=production
PORT=3000
BASE_URL=https://yourdomain.com
JWT_SECRET=very_long_random_production_secret_key

# Production Email Settings (higher limits for paid plans)
EMAILS_PER_MINUTE=300
EMAILS_PER_HOUR=10000

# SSL/Security Settings (for production)
FORCE_SSL=true
SESSION_SECRET=another_secure_random_secret
```

## Security Best Practices

### 1. Secret Generation

Generate secure secrets:
```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate session secret
openssl rand -base64 32

# Generate random password
openssl rand -base64 16
```

### 2. File Permissions

Secure your environment files:
```bash
# Set restrictive permissions
chmod 600 .env
chmod 644 .env.example

# Ensure .env is in .gitignore
echo ".env" >> .gitignore
```

### 3. Environment Validation

Create a validation script:
```bash
cat > validate-env.js << 'EOF'
require('dotenv').config();

const required = [
  'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
  'REDIS_URL',
  'NODE_ENV', 'PORT', 'BASE_URL'
];

const emailProviders = [
  ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'],
  ['SENDGRID_API_KEY'],
  ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION']
];

// Check required variables
const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
  process.exit(1);
}

// Check email provider configuration
const hasEmailProvider = emailProviders.some(provider => 
  provider.every(key => process.env[key])
);

if (!hasEmailProvider) {
  console.error('No email provider configured. Set up one of:');
  console.error('- SMTP: SMTP_HOST, SMTP_USER, SMTP_PASS');
  console.error('- SendGrid: SENDGRID_API_KEY');
  console.error('- AWS SES: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION');
  process.exit(1);
}

console.log('✓ Environment configuration is valid');
EOF

# Run validation
node validate-env.js
```

## Environment-Specific Configurations

### Development Environment

```env
# Development Settings
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug

# Local services
DB_HOST=localhost
REDIS_URL=redis://127.0.0.1:6379

# Lower rate limits for testing
EMAILS_PER_MINUTE=10
EMAILS_PER_HOUR=100

# Local URLs
BASE_URL=http://localhost:3000
```

### Staging Environment

```env
# Staging Settings
NODE_ENV=staging
DEBUG=false
LOG_LEVEL=info

# Staging services
DB_HOST=staging-db.example.com
REDIS_URL=redis://staging-redis.example.com:6379

# Moderate rate limits
EMAILS_PER_MINUTE=60
EMAILS_PER_HOUR=1000

# Staging URLs
BASE_URL=https://staging.yourdomain.com
```

### Production Environment

```env
# Production Settings
NODE_ENV=production
DEBUG=false
LOG_LEVEL=warn

# Production services
DB_HOST=prod-db.example.com
REDIS_URL=redis://prod-redis.example.com:6379

# High rate limits (based on your email provider plan)
EMAILS_PER_MINUTE=300
EMAILS_PER_HOUR=10000

# Production URLs
BASE_URL=https://yourdomain.com
```

## Advanced Configuration Options

### Database Connection Pooling

```env
# Advanced Database Settings
DB_CONNECTION_LIMIT=10            # Max connections in pool
DB_QUEUE_LIMIT=0                 # Max queued connections (0 = unlimited)
DB_TIMEOUT=60000                 # Connection timeout (ms)
DB_ACQUIRE_TIMEOUT=60000         # Acquire connection timeout (ms)
```

### Redis Advanced Settings

```env
# Advanced Redis Settings
REDIS_PASSWORD=your_redis_password
REDIS_DB=0                       # Redis database number
REDIS_RETRY_ATTEMPTS=3           # Connection retry attempts
REDIS_RETRY_DELAY=1000          # Retry delay (ms)
```

### Logging Configuration

```env
# Logging Settings
LOG_LEVEL=info                   # Logging level (error, warn, info, debug)
LOG_FILE=logs/application.log    # Log file path
LOG_MAX_SIZE=10m                # Max log file size
LOG_MAX_FILES=5                 # Max number of log files
```

### Email Provider Specific Settings

#### SendGrid Advanced
```env
SENDGRID_API_KEY=SG.your_api_key
SENDGRID_WEBHOOK_KEY=your_webhook_key    # For event webhooks
SENDGRID_TEMPLATE_ID=d-template-id       # For template emails
```

#### Amazon SES Advanced
```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
SES_CONFIGURATION_SET=your_config_set    # For advanced tracking
SES_FROM_ARN=arn:aws:ses:region:account:identity/domain.com  # For cross-account sending
```

## Environment Variable Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | Database hostname | `localhost` |
| `DB_USER` | Database username | `bulk_email_user` |
| `DB_PASSWORD` | Database password | `secure_password` |
| `DB_NAME` | Database name | `bulk_email_sender` |
| `REDIS_URL` | Redis connection URL | `redis://127.0.0.1:6379` |
| `NODE_ENV` | Application environment | `production` |
| `PORT` | Server port | `3000` |
| `BASE_URL` | Base URL for links | `https://yourdomain.com` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `EMAILS_PER_MINUTE` | Rate limit per minute | `60` |
| `EMAILS_PER_HOUR` | Rate limit per hour | `1000` |
| `JWT_SECRET` | JWT signing secret | Random generated |
| `LOG_LEVEL` | Logging level | `info` |
| `QUEUE_CONCURRENCY` | Concurrent jobs | `5` |

## Loading Environment Variables

### Application Code

The application loads environment variables using dotenv:

```javascript
// At the top of server.js
require('dotenv').config();

// Access variables
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};
```

### Docker Environment

For Docker deployments:

```dockerfile
# In Dockerfile
ENV NODE_ENV=production

# Or pass via docker run
docker run -e NODE_ENV=production -e DB_HOST=localhost your-app
```

```yaml
# In docker-compose.yml
services:
  app:
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - REDIS_URL=redis://redis:6379
    env_file:
      - .env
```

## Troubleshooting

### Common Configuration Issues

**1. Database connection fails**
```bash
# Test database connection
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SELECT 1"
```

**2. Redis connection fails**
```bash
# Test Redis connection
redis-cli -u $REDIS_URL ping
```

**3. Email provider authentication fails**
```bash
# Test email configuration
node -e "
require('dotenv').config();
const emailService = require('./backend/services/emailService');
emailService.testConnection().then(console.log).catch(console.error);
"
```

**4. Missing environment variables**
```bash
# Run validation script
node validate-env.js
```

### Environment Debugging

```bash
# List all environment variables
env | grep -E "(DB_|REDIS_|SMTP_|SENDGRID_|AWS_)"

# Check specific variable
echo "Database host: $DB_HOST"

# Validate .env file loading
node -e "
require('dotenv').config();
console.log('Environment loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  DB_HOST: process.env.DB_HOST,
  REDIS_URL: process.env.REDIS_URL,
  PORT: process.env.PORT
});
"
```

## Deployment Checklist

Before deploying:

- [ ] `.env` file configured with production values
- [ ] Database credentials tested
- [ ] Redis connection verified
- [ ] Email provider configured and tested
- [ ] Rate limits set appropriately
- [ ] SSL certificates configured (production)
- [ ] Domain authentication completed
- [ ] Monitoring and logging configured
- [ ] Backup strategy implemented
- [ ] Security secrets generated and secured

---

**Next Steps**: After configuring your environment, proceed to [Deployment Guide](./deployment.md)