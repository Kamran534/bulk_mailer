const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const handlebars = require('handlebars');

class EmailService {
  constructor() {
    this.transporter = null;
    this.provider = process.env.EMAIL_PROVIDER || 'smtp';
    this.initializeProvider();
  }

  initializeProvider() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.provider = 'sendgrid';
      console.log('Using SendGrid as email provider');
    } else if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      this.provider = 'smtp';
      console.log('Using SMTP as email provider');
    } else {
      throw new Error('No email provider configured. Please set up SMTP or SendGrid credentials.');
    }
  }

  personalizeContent(content, personalData, trackingId) {
    if (!content) return content;

    const template = handlebars.compile(content);
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    const data = {
      ...personalData,
      tracking_pixel: `${baseUrl}/track/open/${trackingId}`,
      unsubscribe_url: `${baseUrl}/track/unsubscribe/${trackingId}`
    };

    let personalizedContent = template(data);

    personalizedContent = this.addTrackingPixel(personalizedContent, trackingId);
    personalizedContent = this.addClickTracking(personalizedContent, trackingId);
    personalizedContent = this.addUnsubscribeLink(personalizedContent, trackingId);

    return personalizedContent;
  }

  personalizeText(content, personalData) {
    if (!content) return content;

    let cleanContent = content;
    
    // Remove tracking pixels completely
    cleanContent = cleanContent.replace(/<img[^>]*track\/open[^>]*>/gi, '');
    
    // Remove unsubscribe links and their surrounding paragraphs
    cleanContent = cleanContent.replace(/<p[^>]*>.*?unsubscribe.*?<\/p>/gis, '');
    
    // Remove any remaining HTML tags
    cleanContent = cleanContent.replace(/<[^>]*>/g, '');
    
    // Clean up any leftover whitespace
    cleanContent = cleanContent.trim();
    
    const template = handlebars.compile(cleanContent);
    return template(personalData);
  }

  addTrackingPixel(htmlContent, trackingId) {
    if (!htmlContent) return htmlContent;
    
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const trackingPixel = `<img src="${baseUrl}/track/open/${trackingId}" width="1" height="1" style="display:none;" alt="" />`;
    
    if (htmlContent.includes('</body>')) {
      return htmlContent.replace('</body>', `${trackingPixel}</body>`);
    } else {
      return htmlContent + trackingPixel;
    }
  }

  addClickTracking(htmlContent, trackingId) {
    if (!htmlContent) return htmlContent;
    
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    return htmlContent.replace(
      /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi,
      (match, before, url, after) => {
        if (url.startsWith('mailto:') || url.startsWith('#') || url.includes('/track/')) {
          return match;
        }
        const trackingUrl = `${baseUrl}/track/click/${trackingId}?url=${encodeURIComponent(url)}`;
        return `<a ${before}href="${trackingUrl}"${after}>`;
      }
    );
  }

  addUnsubscribeLink(htmlContent, trackingId) {
    if (!htmlContent) return htmlContent;
    
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const unsubscribeUrl = `${baseUrl}/track/unsubscribe/${trackingId}`;
    const unsubscribeLink = `<p style="font-size: 12px; color: #666; text-align: center; margin-top: 20px;">
      <a href="${unsubscribeUrl}" style="color: #666; text-decoration: underline;">Unsubscribe</a>
    </p>`;
    
    if (htmlContent.includes('</body>')) {
      return htmlContent.replace('</body>', `${unsubscribeLink}</body>`);
    } else {
      return htmlContent + unsubscribeLink;
    }
  }

  async sendEmail(emailData) {
    const {
      to,
      subject,
      html,
      text,
      from,
      fromName,
      trackingId,
      personalData = {}
    } = emailData;

    const personalizedHtml = this.personalizeContent(html, personalData, trackingId);
    const personalizedText = this.personalizeText(text, personalData);
    const personalizedSubject = this.personalizeText(subject, personalData);

    const fromAddress = fromName ? `${fromName} <${from}>` : from;

    try {
      if (this.provider === 'sendgrid') {
        const msg = {
          to,
          from: fromAddress,
          subject: personalizedSubject,
          text: personalizedText,
          html: personalizedHtml
        };

        await sgMail.send(msg);
      } else if (this.provider === 'smtp') {
        const mailOptions = {
          from: fromAddress,
          to,
          subject: personalizedSubject,
          text: personalizedText,
          html: personalizedHtml
        };

        await this.transporter.sendMail(mailOptions);
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending email:', error);
      return { 
        success: false, 
        error: error.message || 'Unknown error occurred' 
      };
    }
  }

  async testConnection() {
    try {
      if (this.provider === 'smtp' && this.transporter) {
        await this.transporter.verify();
        return { success: true, provider: 'smtp' };
      } else if (this.provider === 'sendgrid') {
        return { success: true, provider: 'sendgrid' };
      }
      return { success: false, error: 'No provider configured' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();