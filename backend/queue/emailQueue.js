const Queue = require('bull');
const redis = require('redis');
const { pool } = require('../config/database');
const emailService = require('../services/emailService');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

const emailQueue = new Queue('email queue', {
  redis: {
    port: 6379,
    host: '127.0.0.1'
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

emailQueue.process('send-email', async (job) => {
  const {
    campaignId,
    recipientId,
    to,
    subject,
    html,
    text,
    from,
    fromName,
    trackingId,
    personalData
  } = job.data;

  try {
    const [campaigns] = await pool.execute(
      'SELECT status FROM campaigns WHERE id = ?',
      [campaignId]
    );

    if (campaigns.length === 0 || campaigns[0].status === 'paused') {
      throw new Error('Campaign is paused or not found');
    }

    const [contacts] = await pool.execute(
      'SELECT status FROM contacts WHERE id = ?',
      [personalData.contact_id || recipientId]
    );

    if (contacts.length === 0 || contacts[0].status !== 'active') {
      throw new Error('Contact is not active');
    }

    const result = await emailService.sendEmail({
      to,
      subject,
      html,
      text,
      from,
      fromName,
      trackingId,
      personalData
    });

    if (result.success) {
      await pool.execute(
        'UPDATE campaign_recipients SET status = ?, sent_at = NOW() WHERE id = ?',
        ['sent', recipientId]
      );

      await pool.execute(
        'UPDATE campaigns SET sent_count = sent_count + 1 WHERE id = ?',
        [campaignId]
      );

      console.log(`Email sent successfully to ${to} for campaign ${campaignId}`);
    } else {
      throw new Error(result.error);
    }

    return { success: true, email: to };
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);

    await pool.execute(
      'UPDATE campaign_recipients SET status = ?, error_message = ? WHERE id = ?',
      ['failed', error.message, recipientId]
    );

    if (error.message.includes('bounce') || error.message.includes('invalid')) {
      await pool.execute(
        'UPDATE contacts SET status = ? WHERE email = ?',
        ['bounced', to]
      );

      await pool.execute(
        'UPDATE campaigns SET bounced_count = bounced_count + 1 WHERE id = ?',
        [campaignId]
      );
    }

    throw error;
  }
});

emailQueue.on('completed', (job, result) => {
  console.log(`Email job completed: ${result.email}`);
});

emailQueue.on('failed', (job, error) => {
  console.error(`Email job failed for ${job.data.to}:`, error.message);
});

emailQueue.on('stalled', (job) => {
  console.warn(`Email job stalled for ${job.data.to}`);
});

const addEmailJob = async (emailData, options = {}) => {
  const defaultOptions = {
    delay: 0,
    priority: 0,
    ...options
  };

  const rateLimitPerMinute = parseInt(process.env.EMAILS_PER_MINUTE) || 60;
  const delayBetweenEmails = Math.ceil(60000 / rateLimitPerMinute);

  const queueSize = await emailQueue.count();
  const delay = queueSize * delayBetweenEmails;

  return emailQueue.add('send-email', emailData, {
    ...defaultOptions,
    delay
  });
};

const getQueueStats = async () => {
  const [waiting, active, completed, failed] = await Promise.all([
    emailQueue.getWaiting(),
    emailQueue.getActive(),
    emailQueue.getCompleted(),
    emailQueue.getFailed()
  ]);

  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length
  };
};

const pauseQueue = () => {
  return emailQueue.pause();
};

const resumeQueue = () => {
  return emailQueue.resume();
};

module.exports = {
  emailQueue,
  addEmailJob,
  getQueueStats,
  pauseQueue,
  resumeQueue
};