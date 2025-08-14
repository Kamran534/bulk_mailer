const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { pool } = require('../config/database');

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'active';

    const [contacts] = await pool.execute(
      `SELECT * FROM contacts WHERE status = ? ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      [status]
    );

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM contacts WHERE status = ?',
      [status]
    );

    res.json({
      contacts,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

router.post('/', async (req, res) => {
  const { email, first_name, last_name } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO contacts (email, first_name, last_name) VALUES (?, ?, ?)',
      [email, first_name || null, last_name || null]
    );

    res.status(201).json({ 
      id: result.insertId, 
      message: 'Contact created successfully' 
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

router.post('/upload-csv', upload.single('csv'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded' });
  }

  const results = [];
  const errors = [];
  let processedCount = 0;
  let successCount = 0;

  try {
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', async () => {
        for (const row of results) {
          processedCount++;
          
          if (!row.email) {
            errors.push({ row: processedCount, error: 'Missing email' });
            continue;
          }

          try {
            await pool.execute(
              'INSERT INTO contacts (email, first_name, last_name) VALUES (?, ?, ?)',
              [
                row.email.trim(),
                row.first_name?.trim() || null,
                row.last_name?.trim() || null
              ]
            );
            successCount++;
          } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
              errors.push({ row: processedCount, email: row.email, error: 'Email already exists' });
            } else {
              errors.push({ row: processedCount, email: row.email, error: error.message });
            }
          }
        }

        fs.unlinkSync(req.file.path);

        res.json({
          message: 'CSV processing completed',
          processed: processedCount,
          successful: successCount,
          failed: errors.length,
          errors: errors.slice(0, 10)
        });
      })
      .on('error', (error) => {
        fs.unlinkSync(req.file.path);
        console.error('Error processing CSV:', error);
        res.status(500).json({ error: 'Failed to process CSV file' });
      });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error uploading CSV:', error);
    res.status(500).json({ error: 'Failed to upload CSV file' });
  }
});

router.patch('/:id/unsubscribe', async (req, res) => {
  try {
    await pool.execute(
      'UPDATE contacts SET status = ? WHERE id = ?',
      ['unsubscribed', req.params.id]
    );
    res.json({ message: 'Contact unsubscribed successfully' });
  } catch (error) {
    console.error('Error unsubscribing contact:', error);
    res.status(500).json({ error: 'Failed to unsubscribe contact' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM contacts WHERE id = ?', [req.params.id]);
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

module.exports = router;