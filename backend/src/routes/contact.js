import { Router } from 'express';
import { query } from '../db.js';
import { HttpError } from '../utils/http-error.js';

const router = Router();

export const CONTACT_TOPICS = ['missing_medicine', 'wrong_information', 'pharmacy_joining', 'other'];

// Very small spam guard: at most 5 messages per 10 minutes from one address.
// (Kept in memory, so it resets when the server restarts.)
const WINDOW_MS = 10 * 60 * 1000;
const MAX_MESSAGES = 5;
const recent = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const times = (recent.get(ip) || []).filter((time) => now - time < WINDOW_MS);
  if (times.length >= MAX_MESSAGES) {
    throw new HttpError(429, 'too_many_messages', 'You have sent several messages already. Please try again in a few minutes.');
  }
  times.push(now);
  recent.set(ip, times);
}

function requireText(body, field, label, min, max) {
  const value = typeof body[field] === 'string' ? body[field].trim() : '';
  if (value.length < min || value.length > max) {
    throw new HttpError(400, 'invalid_field', `${label} must be between ${min} and ${max} characters`);
  }
  return value;
}

// POST /api/contact
// Body: { name, contact, topic, message }
router.post('/', async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};

  const name = requireText(body, 'name', 'Name', 2, 100);
  const contact = requireText(body, 'contact', 'Phone number or email', 5, 120);
  const message = requireText(body, 'message', 'Message', 5, 2000);
  if (!CONTACT_TOPICS.includes(body.topic)) {
    throw new HttpError(400, 'invalid_field', `Topic must be one of: ${CONTACT_TOPICS.join(', ')}`);
  }

  checkRateLimit(req.ip);

  const { rows } = await query(
    `INSERT INTO contact_messages (name, contact, topic, message)
     VALUES ($1, $2, $3, $4)
     RETURNING id, created_at`,
    [name, contact, body.topic, message],
  );

  res.status(201).json({ data: { id: rows[0].id, received_at: rows[0].created_at } });
});

export default router;
