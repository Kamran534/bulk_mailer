const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

router.get('/open/:trackingId', async (req, res) => {
  const { trackingId } = req.params;
  
  try {
    const [recipients] = await pool.execute(
      'SELECT id, campaign_id FROM campaign_recipients WHERE tracking_id = ?',
      [trackingId]
    );

    if (recipients.length > 0) {
      const recipient = recipients[0];
      
      await pool.execute(
        'UPDATE campaign_recipients SET opened_at = NOW() WHERE id = ? AND opened_at IS NULL',
        [recipient.id]
      );

      await pool.execute(`
        INSERT INTO email_tracking (tracking_id, event_type, ip_address, user_agent)
        VALUES (?, 'open', ?, ?)
      `, [trackingId, req.ip, req.get('User-Agent')]);

      await pool.execute(
        'UPDATE campaigns SET opened_count = opened_count + 1 WHERE id = ?',
        [recipient.campaign_id]
      );
    }

    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(pixel);
  } catch (error) {
    console.error('Error tracking email open:', error);
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length
    });
    res.end(pixel);
  }
});

router.get('/click/:trackingId', async (req, res) => {
  const { trackingId } = req.params;
  const { url } = req.query;

  try {
    const [recipients] = await pool.execute(
      'SELECT id, campaign_id FROM campaign_recipients WHERE tracking_id = ?',
      [trackingId]
    );

    if (recipients.length > 0) {
      const recipient = recipients[0];
      
      await pool.execute(
        'UPDATE campaign_recipients SET clicked_at = NOW() WHERE id = ? AND clicked_at IS NULL',
        [recipient.id]
      );

      await pool.execute(`
        INSERT INTO email_tracking (tracking_id, event_type, url, ip_address, user_agent)
        VALUES (?, 'click', ?, ?, ?)
      `, [trackingId, 'click', url, req.ip, req.get('User-Agent')]);

      await pool.execute(
        'UPDATE campaigns SET clicked_count = clicked_count + 1 WHERE id = ?',
        [recipient.campaign_id]
      );
    }

    if (url) {
      res.redirect(decodeURIComponent(url));
    } else {
      res.status(400).json({ error: 'No URL provided' });
    }
  } catch (error) {
    console.error('Error tracking email click:', error);
    if (url) {
      res.redirect(decodeURIComponent(url));
    } else {
      res.status(500).json({ error: 'Tracking failed' });
    }
  }
});

router.get('/unsubscribe/:trackingId', async (req, res) => {
  const { trackingId } = req.params;

  try {
    const [recipients] = await pool.execute(`
      SELECT cr.id, cr.campaign_id, c.id as contact_id, c.email
      FROM campaign_recipients cr
      JOIN contacts c ON cr.contact_id = c.id
      WHERE cr.tracking_id = ?
    `, [trackingId]);

    if (recipients.length > 0) {
      const recipient = recipients[0];
      
      await pool.execute(
        'UPDATE contacts SET status = ? WHERE id = ?',
        ['unsubscribed', recipient.contact_id]
      );

      await pool.execute(`
        INSERT INTO email_tracking (tracking_id, event_type, ip_address, user_agent)
        VALUES (?, 'unsubscribe', ?, ?)
      `, [trackingId, req.ip, req.get('User-Agent')]);

      await pool.execute(
        'UPDATE campaigns SET unsubscribed_count = unsubscribed_count + 1 WHERE id = ?',
        [recipient.campaign_id]
      );

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Unsubscribed</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 600px; margin: 0 auto; }
            h1 { color: #333; }
            p { color: #666; font-size: 16px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Successfully Unsubscribed</h1>
            <p>You have been unsubscribed from our mailing list.</p>
            <p>Email: ${recipient.email}</p>
            <p>If this was a mistake, please contact us to resubscribe.</p>
          </div>
        </body>
        </html>
      `);
    } else {
      res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invalid Link</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 600px; margin: 0 auto; }
            h1 { color: #d32f2f; }
            p { color: #666; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Invalid Unsubscribe Link</h1>
            <p>This unsubscribe link is not valid or has expired.</p>
          </div>
        </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .container { max-width: 600px; margin: 0 auto; }
          h1 { color: #d32f2f; }
          p { color: #666; font-size: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Error</h1>
          <p>An error occurred while processing your request.</p>
        </div>
      </body>
      </html>
    `);
  }
});

module.exports = router;