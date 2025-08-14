# 🔌 API Reference

This document provides a complete reference for the Bulk Email Sender REST API endpoints.

## Base URL

```
http://localhost:3000/api  (Development)
https://yourdomain.com/api (Production)
```

## Authentication

Currently, the API does not require authentication. In production, consider implementing JWT tokens or API keys.

## Response Format

All API responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Campaigns API

### List Campaigns

Get all email campaigns with statistics.

**Endpoint:** `GET /api/campaigns`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Welcome Series Campaign",
    "subject": "Welcome to our newsletter!",
    "html_content": "<h1>Welcome!</h1><p>Thank you for subscribing.</p>",
    "text_content": "Welcome! Thank you for subscribing.",
    "from_email": "noreply@example.com",
    "from_name": "Company Name",
    "status": "sent",
    "scheduled_at": null,
    "sent_at": "2025-08-14T10:30:00.000Z",
    "total_recipients": 1500,
    "sent_count": 1500,
    "opened_count": 450,
    "clicked_count": 89,
    "bounced_count": 12,
    "unsubscribed_count": 5,
    "created_at": "2025-08-14T09:00:00.000Z",
    "updated_at": "2025-08-14T11:00:00.000Z"
  }
]
```

### Get Campaign Details

Get detailed information about a specific campaign including recipients.

**Endpoint:** `GET /api/campaigns/:id`

**Parameters:**
- `id` (integer) - Campaign ID

**Response:**
```json
{
  "campaign": {
    "id": 1,
    "name": "Welcome Series Campaign",
    "subject": "Welcome to our newsletter!",
    "html_content": "<h1>Welcome {{first_name}}!</h1>",
    "text_content": "Welcome {{first_name}}!",
    "from_email": "noreply@example.com",
    "from_name": "Company Name",
    "status": "sent",
    "total_recipients": 1500,
    "sent_count": 1500,
    "opened_count": 450,
    "clicked_count": 89,
    "created_at": "2025-08-14T09:00:00.000Z"
  },
  "recipients": [
    {
      "id": 1,
      "campaign_id": 1,
      "contact_id": 123,
      "status": "sent",
      "sent_at": "2025-08-14T10:30:15.000Z",
      "opened_at": "2025-08-14T11:45:22.000Z",
      "clicked_at": null,
      "tracking_id": "abc123-def456-ghi789",
      "error_message": null,
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe"
    }
  ]
}
```

### Create Campaign

Create a new email campaign.

**Endpoint:** `POST /api/campaigns`

**Request Body:**
```json
{
  "name": "Summer Sale Campaign",
  "subject": "🏖️ Summer Sale - 50% Off Everything!",
  "html_content": "<h1>Hello {{first_name}}!</h1><p>Don't miss our summer sale!</p>",
  "text_content": "Hello {{first_name}}! Don't miss our summer sale!",
  "from_email": "sales@example.com",
  "from_name": "Sales Team",
  "contact_ids": [123, 456, 789]
}
```

**Required Fields:**
- `name` (string) - Campaign name
- `subject` (string) - Email subject line
- `from_email` (string) - Sender email address
- `contact_ids` (array) - Array of contact IDs to send to

**Optional Fields:**
- `html_content` (string) - HTML email content
- `text_content` (string) - Plain text email content  
- `from_name` (string) - Sender display name

**Response:**
```json
{
  "id": 2,
  "message": "Campaign created successfully",
  "recipients_added": 3
}
```

### Send Campaign

Start sending a draft campaign.

**Endpoint:** `POST /api/campaigns/:id/send`

**Parameters:**
- `id` (integer) - Campaign ID

**Response:**
```json
{
  "message": "Campaign sending started",
  "recipients_queued": 1500
}
```

**Error Responses:**
- `404` - Campaign not found or already sent
- `400` - No valid recipients found

### Pause Campaign

Pause a currently sending campaign.

**Endpoint:** `PATCH /api/campaigns/:id/pause`

**Parameters:**
- `id` (integer) - Campaign ID

**Response:**
```json
{
  "message": "Campaign paused"
}
```

### Delete Campaign

Delete a campaign and all associated data.

**Endpoint:** `DELETE /api/campaigns/:id`

**Parameters:**
- `id` (integer) - Campaign ID

**Response:**
```json
{
  "message": "Campaign deleted successfully"
}
```

## Contacts API

### List Contacts

Get paginated list of contacts with optional filtering.

**Endpoint:** `GET /api/contacts`

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 50) - Items per page
- `status` (string, default: "active") - Filter by status (active, unsubscribed, bounced)

**Example:** `GET /api/contacts?page=2&limit=20&status=active`

**Response:**
```json
{
  "contacts": [
    {
      "id": 123,
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "status": "active",
      "created_at": "2025-08-14T09:00:00.000Z",
      "updated_at": "2025-08-14T09:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 1500,
    "pages": 75
  }
}
```

### Add Contact

Add a single contact to the database.

**Endpoint:** `POST /api/contacts`

**Request Body:**
```json
{
  "email": "jane@example.com",
  "first_name": "Jane",
  "last_name": "Smith"
}
```

**Required Fields:**
- `email` (string) - Valid email address (must be unique)

**Optional Fields:**
- `first_name` (string) - Contact's first name
- `last_name` (string) - Contact's last name

**Response:**
```json
{
  "id": 124,
  "message": "Contact added successfully"
}
```

**Error Responses:**
- `400` - Invalid email format or missing required fields
- `409` - Email already exists

### Upload CSV

Bulk import contacts from CSV file.

**Endpoint:** `POST /api/contacts/upload-csv`

**Request:** Multipart form data with CSV file

**CSV Format:**
```csv
email,first_name,last_name
john@example.com,John,Doe
jane@example.com,Jane,Smith
bob@example.com,Bob,Wilson
```

**Headers Required:**
- `Content-Type: multipart/form-data`

**Response:**
```json
{
  "message": "CSV upload completed",
  "imported": 150,
  "skipped": 3,
  "errors": [
    {
      "row": 5,
      "email": "invalid-email",
      "error": "Invalid email format"
    }
  ]
}
```

### Unsubscribe Contact

Mark a contact as unsubscribed.

**Endpoint:** `PATCH /api/contacts/:id/unsubscribe`

**Parameters:**
- `id` (integer) - Contact ID

**Response:**
```json
{
  "message": "Contact unsubscribed successfully"
}
```

### Delete Contact

Remove a contact from the database.

**Endpoint:** `DELETE /api/contacts/:id`

**Parameters:**
- `id` (integer) - Contact ID

**Response:**
```json
{
  "message": "Contact deleted successfully"
}
```

## Tracking API

### Track Email Open

Track when an email is opened (called automatically by email clients).

**Endpoint:** `GET /track/open/:trackingId`

**Parameters:**
- `trackingId` (string) - Unique tracking identifier

**Response:** 1x1 transparent pixel image

**Side Effects:**
- Records open event in database
- Updates campaign statistics
- Updates recipient record

### Track Link Click

Track when a link in an email is clicked.

**Endpoint:** `GET /track/click/:trackingId`

**Parameters:**
- `trackingId` (string) - Unique tracking identifier

**Query Parameters:**
- `url` (string) - Original URL to redirect to

**Example:** `GET /track/click/abc123?url=https://example.com/product`

**Response:** HTTP 302 redirect to original URL

**Side Effects:**
- Records click event in database
- Updates campaign statistics
- Updates recipient record

### Handle Unsubscribe

Process unsubscribe requests from email links.

**Endpoint:** `GET /track/unsubscribe/:trackingId`

**Parameters:**
- `trackingId` (string) - Unique tracking identifier

**Response:** HTML unsubscribe confirmation page

**Side Effects:**
- Marks contact as unsubscribed
- Records unsubscribe event
- Updates campaign statistics

## Queue Management API

### Get Queue Statistics

Get current email queue status and statistics.

**Endpoint:** `GET /api/queue/stats`

**Response:**
```json
{
  "waiting": 45,
  "active": 5,
  "completed": 1250,
  "failed": 12,
  "queue_health": "healthy",
  "processing_rate": "58 emails/minute",
  "estimated_completion": "2025-08-14T12:30:00.000Z"
}
```

### Pause Queue

Pause email processing (admin function).

**Endpoint:** `POST /api/queue/pause`

**Response:**
```json
{
  "message": "Email queue paused"
}
```

### Resume Queue

Resume email processing (admin function).

**Endpoint:** `POST /api/queue/resume`

**Response:**
```json
{
  "message": "Email queue resumed"
}
```

## Health Check API

### Application Health

Check application status and connectivity.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-08-14T10:30:00.000Z",
  "uptime": 86400,
  "memory": {
    "rss": 150000000,
    "heapTotal": 100000000,
    "heapUsed": 75000000
  },
  "services": {
    "database": "connected",
    "redis": "connected",
    "email_provider": "authenticated"
  }
}
```

### Database Health

Check database connectivity and performance.

**Endpoint:** `GET /health/database`

**Response:**
```json
{
  "status": "connected",
  "response_time": "5ms",
  "active_connections": 3,
  "total_contacts": 15000,
  "total_campaigns": 25
}
```

## Error Codes

### HTTP Status Codes

- `200` - Success
- `201` - Created successfully
- `400` - Bad request (validation errors)
- `404` - Resource not found
- `409` - Conflict (duplicate data)
- `422` - Unprocessable entity
- `500` - Internal server error
- `503` - Service unavailable

### Custom Error Codes

- `INVALID_EMAIL` - Email format is invalid
- `DUPLICATE_EMAIL` - Email already exists
- `CAMPAIGN_NOT_FOUND` - Campaign does not exist
- `CAMPAIGN_ALREADY_SENT` - Campaign has already been sent
- `NO_RECIPIENTS` - No valid recipients found
- `PROVIDER_ERROR` - Email provider authentication failed
- `QUEUE_ERROR` - Queue processing error
- `DATABASE_ERROR` - Database connection or query error

## Rate Limits

### API Rate Limits

- **General API**: 100 requests per 15 minutes per IP
- **File uploads**: 10 requests per hour per IP
- **Email sending**: Based on provider limits and configuration

### Email Sending Limits

Configured via environment variables:
- `EMAILS_PER_MINUTE` - Default: 60
- `EMAILS_PER_HOUR` - Default: 1000

## Template Variables

### Available Variables

Use these variables in email content:

- `{{first_name}}` - Contact's first name
- `{{last_name}}` - Contact's last name
- `{{email}}` - Contact's email address
- `{{unsubscribe_url}}` - Automatic unsubscribe link

### Automatic Additions

The system automatically adds:
- **Tracking pixel** - For open tracking
- **Link tracking** - All links are wrapped for click tracking
- **Unsubscribe link** - Added to email footer

## Webhooks (Future Enhancement)

### Email Events

Configure webhook endpoints to receive real-time email events:

**Event Types:**
- `email.sent` - Email successfully sent
- `email.delivered` - Email delivered to recipient
- `email.opened` - Email opened by recipient
- `email.clicked` - Link clicked in email
- `email.bounced` - Email bounced
- `email.unsubscribed` - Recipient unsubscribed

**Payload Example:**
```json
{
  "event": "email.opened",
  "timestamp": "2025-08-14T10:30:00.000Z",
  "campaign_id": 123,
  "recipient_id": 456,
  "tracking_id": "abc123-def456",
  "email": "john@example.com",
  "metadata": {
    "user_agent": "Mozilla/5.0...",
    "ip_address": "192.168.1.100"
  }
}
```

## SDK Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

class BulkEmailAPI {
  constructor(baseURL = 'http://localhost:3000/api') {
    this.client = axios.create({ baseURL });
  }

  // Create campaign
  async createCampaign(campaignData) {
    const response = await this.client.post('/campaigns', campaignData);
    return response.data;
  }

  // Send campaign
  async sendCampaign(campaignId) {
    const response = await this.client.post(`/campaigns/${campaignId}/send`);
    return response.data;
  }

  // Add contact
  async addContact(contactData) {
    const response = await this.client.post('/contacts', contactData);
    return response.data;
  }

  // Get campaign stats
  async getCampaignStats(campaignId) {
    const response = await this.client.get(`/campaigns/${campaignId}`);
    return response.data;
  }
}

// Usage
const api = new BulkEmailAPI();

// Create and send campaign
const campaign = await api.createCampaign({
  name: 'Product Launch',
  subject: 'New Product Available!',
  html_content: '<h1>Hello {{first_name}}!</h1>',
  from_email: 'hello@company.com',
  contact_ids: [1, 2, 3]
});

await api.sendCampaign(campaign.id);
```

### Python

```python
import requests

class BulkEmailAPI:
    def __init__(self, base_url='http://localhost:3000/api'):
        self.base_url = base_url

    def create_campaign(self, campaign_data):
        response = requests.post(f'{self.base_url}/campaigns', json=campaign_data)
        return response.json()

    def send_campaign(self, campaign_id):
        response = requests.post(f'{self.base_url}/campaigns/{campaign_id}/send')
        return response.json()

    def add_contact(self, contact_data):
        response = requests.post(f'{self.base_url}/contacts', json=contact_data)
        return response.json()

# Usage
api = BulkEmailAPI()

campaign = api.create_campaign({
    'name': 'Newsletter',
    'subject': 'Monthly Update',
    'html_content': '<h1>Hello {{first_name}}!</h1>',
    'from_email': 'news@company.com',
    'contact_ids': [1, 2, 3]
})

api.send_campaign(campaign['id'])
```

### cURL Examples

```bash
# Create campaign
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Welcome Campaign",
    "subject": "Welcome to our service!",
    "html_content": "<h1>Welcome {{first_name}}!</h1>",
    "from_email": "welcome@company.com",
    "contact_ids": [1, 2, 3]
  }'

# Send campaign
curl -X POST http://localhost:3000/api/campaigns/1/send

# Add contact
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "email": "new@example.com",
    "first_name": "New",
    "last_name": "User"
  }'

# Upload CSV
curl -X POST http://localhost:3000/api/contacts/upload-csv \
  -F "file=@contacts.csv"
```

---

**Need help?** Check the [Troubleshooting Guide](./troubleshooting.md) or refer to the application logs for detailed error information.