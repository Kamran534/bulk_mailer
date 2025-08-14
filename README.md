# Email Sender Pro

<div align="center">
  <img src="frontend/public/logo.png" alt="Email Sender Logo" width="120" height="120">
  
  **Professional Bulk Email Marketing Platform**
  
  A production-ready email marketing solution with Node.js backend and React frontend, featuring advanced campaign management, contact handling, email personalization, tracking, and deliverability tools.
</div>

## Features

### Core Functionality
- 📧 **Bulk Email Sending** - Send personalized emails to large contact lists
- 📊 **Campaign Management** - Create, schedule, and monitor email campaigns
- 👥 **Contact Management** - Import contacts via CSV, manage subscriber lists
- 📈 **Analytics & Tracking** - Track opens, clicks, bounces, and unsubscribes
- 🎨 **Email Personalization** - Use template variables like {{first_name}}
- 🚦 **Queue Management** - Rate-limited sending to avoid being blacklisted

### Technical Features
- ⚡ **Multiple Email Providers** - SMTP, SendGrid, Amazon SES support
- 🔄 **Redis Queue System** - Background job processing with Bull
- 📱 **Responsive UI** - React frontend with Bootstrap styling
- 🗄️ **MySQL Database** - Reliable data storage with proper indexing
- 🔒 **Security** - Rate limiting, input validation, CORS protection
- 📊 **Real-time Stats** - Live campaign performance metrics

## Architecture

```
bulk-email-sender/
├── backend/                 # Node.js Express API
│   ├── config/             # Database and configuration
│   ├── routes/             # API endpoints
│   ├── services/           # Email service layer
│   ├── queue/              # Background job processing
│   └── server.js           # Main server file
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   └── services/       # API client
│   └── public/
├── uploads/                # Temporary file storage
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- MySQL 8.0+
- Redis 6.0+
- Email provider (SMTP, SendGrid, or Amazon SES)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd bulk_mail_sender
npm install
cd frontend && npm install && cd ..
```

2. **Database setup:**
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE bulk_email_sender;
exit
```

3. **Environment configuration:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start services:**
```bash
# Start Redis (if not running)
redis-server

# Start backend
npm run dev

# Start frontend (new terminal)
npm run frontend
```

5. **Access the application:**
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Health check: http://localhost:3000/health

## Configuration

### Environment Variables

Create a `.env` file with these required settings:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bulk_email_sender

# Redis
REDIS_URL=redis://127.0.0.1:6379

# Email Provider (choose one)
# Option 1: SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Option 2: SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key

# Option 3: Amazon SES
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# Application
PORT=3000
BASE_URL=http://localhost:3000
EMAILS_PER_MINUTE=60
```

### Email Provider Setup

#### Gmail SMTP
1. Enable 2-factor authentication
2. Generate an App Password
3. Use app password in SMTP_PASS

#### SendGrid
1. Create SendGrid account
2. Generate API key
3. Set SENDGRID_API_KEY

#### Amazon SES
1. Setup AWS SES
2. Verify sending domain
3. Configure AWS credentials

## Usage

### 1. Add Contacts
- **Manual**: Add individual contacts through the UI
- **CSV Upload**: Bulk import with format: `email,first_name,last_name`

### 2. Create Campaign
1. Go to Campaigns → Create New Campaign
2. Fill campaign details (name, subject, from email)
3. Write email content (HTML and text versions)
4. Use template variables: `{{first_name}}`, `{{last_name}}`, `{{email}}`
5. Select recipients
6. Create campaign (saves as draft)

### 3. Send Campaign
1. Review campaign details
2. Click "Send Campaign"
3. Monitor real-time progress
4. View analytics and recipient status

### 4. Track Performance
- **Open Rate**: Tracked via invisible pixel
- **Click Rate**: All links automatically tracked
- **Unsubscribes**: Automatic unsubscribe links added
- **Bounces**: Handled automatically

## Email Template Variables

Use these variables in your email content:

- `{{first_name}}` - Recipient's first name
- `{{last_name}}` - Recipient's last name  
- `{{email}}` - Recipient's email address
- `{{unsubscribe_url}}` - Automatic unsubscribe link

Example:
```html
<h1>Hello {{first_name}}!</h1>
<p>Thank you for subscribing with {{email}}.</p>
<a href="{{unsubscribe_url}}">Unsubscribe</a>
```

## API Endpoints

### Campaigns
- `GET /api/campaigns` - List all campaigns
- `POST /api/campaigns` - Create new campaign
- `GET /api/campaigns/:id` - Get campaign details
- `POST /api/campaigns/:id/send` - Send campaign
- `PATCH /api/campaigns/:id/pause` - Pause campaign

### Contacts
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Add single contact
- `POST /api/contacts/upload-csv` - Bulk upload CSV

### Tracking
- `GET /track/open/:trackingId` - Track email opens
- `GET /track/click/:trackingId` - Track link clicks
- `GET /track/unsubscribe/:trackingId` - Handle unsubscribes

## Deliverability Best Practices

### Domain Authentication
Set up these DNS records for your sending domain:

**SPF Record:**
```
v=spf1 include:_spf.google.com ~all
```

**DKIM**: Generate and add DKIM keys through your email provider

**DMARC Record:**
```
v=DMARC1; p=quarantine; rua=mailto:admin@yourdomain.com
```

### Sending Best Practices
- Start with small batches and gradually increase
- Maintain clean subscriber lists
- Monitor bounce and complaint rates
- Use double opt-in for new subscribers
- Include clear unsubscribe links
- Avoid spam trigger words

### Rate Limiting
The system automatically rate-limits sending:
- Default: 60 emails per minute
- Adjustable via `EMAILS_PER_MINUTE` environment variable
- Queue system prevents overwhelming email providers

## Compliance

### Legal Requirements
- **CAN-SPAM Act** (US): Include physical address, clear unsubscribe
- **GDPR** (EU): Obtain explicit consent, provide data deletion
- **CASL** (Canada): Get permission before sending

### Built-in Compliance Features
- Automatic unsubscribe links in all emails
- Unsubscribe handling and list management
- Bounce processing and suppression
- Contact consent tracking

## Troubleshooting

### Common Issues

**Database connection fails:**
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u root -p bulk_email_sender
```

**Redis connection fails:**
```bash
# Check Redis is running
redis-cli ping

# Start Redis if needed
redis-server
```

**Emails not sending:**
1. Check email provider credentials
2. Verify domain authentication (SPF/DKIM)
3. Check rate limits and queue status
4. Review error logs

**High bounce rate:**
1. Clean your contact list
2. Remove invalid email addresses
3. Check domain reputation
4. Implement double opt-in

### Logs and Monitoring
- Backend logs: Check console output for errors
- Queue status: Monitor Redis queue through logs
- Email delivery: Check email provider dashboards

## Security Considerations

- Keep environment variables secure
- Use strong database passwords
- Regularly update dependencies
- Monitor for suspicious activity
- Implement proper access controls
- Don't log sensitive information

## Performance Optimization

- Use Redis for queue management
- Index database queries properly
- Monitor memory usage during large sends
- Consider horizontal scaling for high volume
- Optimize email content size
- Cache frequently accessed data

