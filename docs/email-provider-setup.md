# 📧 Email Provider Setup Guide

This guide covers setting up email providers for the Bulk Email Sender application. Choose one or more providers based on your needs and budget.

## Supported Email Providers

1. **SMTP** - Generic SMTP (Gmail, Outlook, etc.)
2. **SendGrid** - Dedicated email service
3. **Amazon SES** - AWS email service

## Provider Comparison

| Provider | Cost | Reliability | Features | Setup Complexity |
|----------|------|-------------|----------|------------------|
| Gmail SMTP | Free (limited) | Good | Basic | Easy |
| SendGrid | Pay-per-email | Excellent | Advanced | Medium |
| Amazon SES | Very cheap | Excellent | Advanced | Medium |

## 1. SMTP Setup (Gmail)

### Prerequisites
- Gmail account with 2FA enabled
- App Password generated

### Setup Steps

#### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification**
3. Follow the setup process to enable 2FA

#### Step 2: Generate App Password
1. Go to **Security** → **2-Step Verification** → **App passwords**
2. Select **Mail** as the app
3. Select **Other (Custom name)** as device
4. Enter "Bulk Email Sender" as the name
5. Copy the generated 16-character password

#### Step 3: Configure Environment Variables
```env
# SMTP Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_character_app_password

# Remove SendGrid/SES config if present
# SENDGRID_API_KEY=
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
```

#### Step 4: Test Connection
```bash
cd /home/muhammad-kamran/Desktop/bulk_mail_sender
node -e "
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection failed:', error);
  } else {
    console.log('SMTP connection successful!');
  }
});
"
```

### Other SMTP Providers

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@outlook.com
SMTP_PASS=your_password
```

#### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@yahoo.com
SMTP_PASS=your_app_password
```

#### Custom SMTP Server
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_password
```

## 2. SendGrid Setup

### Prerequisites
- SendGrid account
- Verified sender identity

### Setup Steps

#### Step 1: Create SendGrid Account
1. Go to [SendGrid](https://sendgrid.com/)
2. Sign up for a free account (100 emails/day) or paid plan
3. Verify your email address

#### Step 2: Create API Key
1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Choose **Restricted Access**
4. Set these permissions:
   - **Mail Send**: Full Access
   - **Template Engine**: Read Access (optional)
   - **Tracking**: Read Access
5. Copy the API key (save it securely!)

#### Step 3: Verify Sender Identity
1. Go to **Settings** → **Sender Authentication**
2. Choose **Single Sender Verification** for testing
3. Enter your sending email and details
4. Check your email and click verification link

For production, set up **Domain Authentication**:
1. Go to **Settings** → **Sender Authentication** → **Domain Authentication**
2. Add your domain (e.g., `yourdomain.com`)
3. Add the provided DNS records to your domain
4. Wait for verification

#### Step 4: Configure Environment Variables
```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.your_api_key_here

# Remove SMTP/SES config if present
# SMTP_HOST=
# SMTP_PORT=
# SMTP_USER=
# SMTP_PASS=
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
```

#### Step 5: Test Connection
```bash
cd /home/muhammad-kamran/Desktop/bulk_mail_sender
node -e "
require('dotenv').config();
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'test@example.com',
  from: 'your_verified_email@domain.com',
  subject: 'SendGrid Test',
  text: 'Test email from SendGrid'
};

sgMail.send(msg)
  .then(() => console.log('SendGrid test successful!'))
  .catch(error => console.error('SendGrid test failed:', error));
"
```

### SendGrid Best Practices

**Domain Authentication Setup**:
```dns
# Add these DNS records to your domain
CNAME s1._domainkey.yourdomain.com -> s1.domainkey.u12345.wl123.sendgrid.net
CNAME s2._domainkey.yourdomain.com -> s2.domainkey.u12345.wl123.sendgrid.net
CNAME em1234.yourdomain.com -> u12345.wl123.sendgrid.net
```

**IP Warmup** (for high volume):
1. Start with small daily volumes (50-100 emails)
2. Gradually increase over 4-8 weeks
3. Monitor reputation metrics
4. Maintain consistent sending patterns

## 3. Amazon SES Setup

### Prerequisites
- AWS account
- AWS CLI installed (optional)
- Domain ownership verification

### Setup Steps

#### Step 1: Create AWS Account
1. Go to [AWS](https://aws.amazon.com/)
2. Create account or sign in
3. Navigate to **SES** (Simple Email Service)

#### Step 2: Verify Domain/Email
1. In SES Console, go to **Verified Identities**
2. Click **Create Identity**
3. Choose **Domain** (recommended) or **Email address**

**For Domain Verification**:
1. Enter your domain (e.g., `yourdomain.com`)
2. Choose **Easy DKIM** (recommended)
3. Add the provided DNS records:
   ```dns
   # TXT record for domain verification
   _amazonses.yourdomain.com -> "verification_token_here"
   
   # CNAME records for DKIM
   token1._domainkey.yourdomain.com -> token1.dkim.amazonses.com
   token2._domainkey.yourdomain.com -> token2.dkim.amazonses.com
   token3._domainkey.yourdomain.com -> token3.dkim.amazonses.com
   ```

#### Step 3: Create IAM User
1. Go to **IAM** → **Users** → **Create User**
2. Username: `bulk-email-sender-ses`
3. Attach policy: **AmazonSESFullAccess** (or custom policy)

Custom policy (recommended):
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ses:SendEmail",
                "ses:SendRawEmail",
                "ses:GetSendQuota",
                "ses:GetSendStatistics"
            ],
            "Resource": "*"
        }
    ]
}
```

#### Step 4: Generate Access Keys
1. Select your IAM user
2. Go to **Security credentials**
3. Click **Create access key**
4. Choose **Application running on AWS compute service**
5. Save the Access Key ID and Secret Key

#### Step 5: Request Production Access
1. In SES Console, go to **Account dashboard**
2. Click **Request production access**
3. Fill out the form with:
   - Use case description
   - Expected sending volume
   - Bounce/complaint handling process

#### Step 6: Configure Environment Variables
```env
# Amazon SES Configuration
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1

# Remove SMTP/SendGrid config if present
# SMTP_HOST=
# SMTP_PORT=
# SMTP_USER=
# SMTP_PASS=
# SENDGRID_API_KEY=
```

#### Step 7: Test Connection
```bash
cd /home/muhammad-kamran/Desktop/bulk_mail_sender
node -e "
require('dotenv').config();
const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const ses = new AWS.SES();

const params = {
  Destination: {
    ToAddresses: ['test@example.com']
  },
  Message: {
    Body: {
      Text: { Data: 'Test email from Amazon SES' }
    },
    Subject: { Data: 'SES Test' }
  },
  Source: 'your_verified_email@domain.com'
};

ses.sendEmail(params, (err, data) => {
  if (err) {
    console.error('SES test failed:', err);
  } else {
    console.log('SES test successful:', data.MessageId);
  }
});
"
```

## Environment Configuration Summary

Choose one provider and configure accordingly:

### Complete .env Template
```env
# Database
DB_HOST=localhost
DB_USER=bulk_email_user
DB_PASSWORD=your_db_password
DB_NAME=bulk_email_sender

# Redis
REDIS_URL=redis://127.0.0.1:6379

# Application
PORT=3000
NODE_ENV=production
BASE_URL=https://yourdomain.com

# Rate Limiting
EMAILS_PER_MINUTE=60
EMAILS_PER_HOUR=1000

# Choose ONE email provider below:

# Option 1: SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Option 2: SendGrid
# SENDGRID_API_KEY=SG.your_api_key

# Option 3: Amazon SES
# AWS_ACCESS_KEY_ID=your_access_key
# AWS_SECRET_ACCESS_KEY=your_secret_key
# AWS_REGION=us-east-1
```

## Deliverability Best Practices

### 1. Domain Authentication

**SPF Record** (Add to DNS):
```dns
# For Gmail/SMTP
v=spf1 include:_spf.google.com ~all

# For SendGrid
v=spf1 include:sendgrid.net ~all

# For Amazon SES
v=spf1 include:amazonses.com ~all
```

**DMARC Record**:
```dns
_dmarc.yourdomain.com TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com; ruf=mailto:dmarc@yourdomain.com"
```

### 2. List Management

- Use double opt-in for new subscribers
- Regularly clean bounced emails
- Honor unsubscribe requests immediately
- Monitor complaint rates (< 0.1%)

### 3. Content Best Practices

- Avoid spam trigger words
- Maintain good text-to-HTML ratio
- Include physical address in footer
- Use clear, descriptive subject lines
- Test emails across different clients

### 4. Sending Patterns

- Start with low volumes and gradually increase
- Maintain consistent sending frequency
- Avoid sudden volume spikes
- Monitor delivery rates and adjust

## Monitoring and Analytics

### Provider Dashboards

**SendGrid**:
- Activity Feed: Real-time sending events
- Stats: Delivery, bounce, and engagement metrics
- Suppressions: Bounces, blocks, and unsubscribes

**Amazon SES**:
- Sending Statistics: Volume and bounce rates
- Reputation Tracking: Bounce and complaint rates
- Configuration Sets: Advanced tracking

**Gmail/SMTP**:
- Limited built-in analytics
- Use application-level tracking
- Monitor SMTP response codes

### Application Metrics

The application tracks:
- Campaign performance (opens, clicks, bounces)
- Delivery success rates
- Queue processing times
- Error rates by provider

## Troubleshooting

### Common Issues

**1. Authentication Failures**
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```
- Verify credentials are correct
- Check if 2FA/App Password is required
- Ensure account is not locked

**2. Rate Limiting**
```
Error: 550 Daily sending quota exceeded
```
- Check provider limits
- Adjust `EMAILS_PER_MINUTE` in .env
- Upgrade to paid plan if needed

**3. Domain Authentication Issues**
```
Error: Domain not verified
```
- Complete domain verification process
- Wait for DNS propagation (up to 48 hours)
- Check DNS records are correctly added

**4. High Bounce Rates**
- Clean your contact list
- Use email validation services
- Implement double opt-in
- Remove hard bounces immediately

### Provider-Specific Debugging

**SendGrid Debug**:
```bash
# Enable debug logging
export DEBUG=sendgrid

# Check API response
curl -X GET \
  https://api.sendgrid.com/v3/user/account \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Amazon SES Debug**:
```bash
# Check sending quota
aws ses get-send-quota --region us-east-1

# Check reputation
aws ses get-reputation --region us-east-1
```

---

**Next Steps**: After configuring your email provider, proceed to [Environment Setup](./environment-setup.md)