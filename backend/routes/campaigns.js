const express = require('express');
const { pool } = require('../config/database');
const { addEmailJob } = require('../queue/emailQueue');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [campaigns] = await pool.execute(`
      SELECT * FROM campaigns 
      ORDER BY created_at DESC
    `);
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [campaigns] = await pool.execute(
      'SELECT * FROM campaigns WHERE id = ?',
      [req.params.id]
    );
    
    if (campaigns.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const [recipients] = await pool.execute(`
      SELECT cr.*, c.email, c.first_name, c.last_name
      FROM campaign_recipients cr
      JOIN contacts c ON cr.contact_id = c.id
      WHERE cr.campaign_id = ?
    `, [req.params.id]);

    res.json({
      campaign: campaigns[0],
      recipients
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

router.post('/', async (req, res) => {
  const { name, subject, html_content, text_content, from_email, from_name, contact_ids } = req.body;

  if (!name || !subject || !from_email || !contact_ids || contact_ids.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const [result] = await pool.execute(`
      INSERT INTO campaigns (name, subject, html_content, text_content, from_email, from_name, total_recipients)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, subject, html_content, text_content, from_email, from_name, contact_ids.length]);

    const campaignId = result.insertId;

    for (const contactId of contact_ids) {
      const trackingId = uuidv4();
      await pool.execute(`
        INSERT INTO campaign_recipients (campaign_id, contact_id, tracking_id)
        VALUES (?, ?, ?)
      `, [campaignId, contactId, trackingId]);
    }

    res.status(201).json({ 
      id: campaignId, 
      message: 'Campaign created successfully',
      recipients_added: contact_ids.length
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

router.post('/:id/send', async (req, res) => {
  try {
    const [campaigns] = await pool.execute(
      'SELECT * FROM campaigns WHERE id = ? AND status = ?',
      [req.params.id, 'draft']
    );

    if (campaigns.length === 0) {
      return res.status(404).json({ error: 'Campaign not found or already sent' });
    }

    const campaign = campaigns[0];

    const [recipients] = await pool.execute(`
      SELECT cr.*, c.email, c.first_name, c.last_name
      FROM campaign_recipients cr
      JOIN contacts c ON cr.contact_id = c.id
      WHERE cr.campaign_id = ? AND cr.status = 'pending' AND c.status = 'active'
    `, [req.params.id]);

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No valid recipients found' });
    }

    await pool.execute(
      'UPDATE campaigns SET status = ?, sent_at = NOW() WHERE id = ?',
      ['sending', req.params.id]
    );

    for (const recipient of recipients) {
      await addEmailJob({
        campaignId: campaign.id,
        recipientId: recipient.id,
        to: recipient.email,
        subject: campaign.subject,
        html: campaign.html_content,
        text: campaign.text_content,
        from: campaign.from_email,
        fromName: campaign.from_name,
        trackingId: recipient.tracking_id,
        personalData: {
          contact_id: recipient.contact_id,
          first_name: recipient.first_name,
          last_name: recipient.last_name,
          email: recipient.email
        }
      });
    }

    res.json({ 
      message: 'Campaign sending started',
      recipients_queued: recipients.length
    });
  } catch (error) {
    console.error('Error sending campaign:', error);
    res.status(500).json({ error: 'Failed to start campaign sending' });
  }
});

router.patch('/:id/pause', async (req, res) => {
  try {
    await pool.execute(
      'UPDATE campaigns SET status = ? WHERE id = ? AND status = ?',
      ['paused', req.params.id, 'sending']
    );
    res.json({ message: 'Campaign paused' });
  } catch (error) {
    console.error('Error pausing campaign:', error);
    res.status(500).json({ error: 'Failed to pause campaign' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM campaigns WHERE id = ?', [req.params.id]);
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

module.exports = router;