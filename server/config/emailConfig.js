/**
 * emailConfig.js — Centralized Brevo Transactional Email Configuration & Validation
 */

require('dotenv').config();

const BREVO_API_KEY = (process.env.BREVO_API_KEY || '').trim();
const SENDER_EMAIL = (process.env.SENDER_EMAIL || 'en24cs3010863@medicaps.ac.in').trim();
const SENDER_NAME = (process.env.SENDER_NAME || 'iMovies').trim();

/**
 * Validates the loaded configuration parameters
 * @returns {{ isValid: boolean, missing: string[] }}
 */
const validateConfig = () => {
  const missing = [];
  if (!BREVO_API_KEY) missing.push('BREVO_API_KEY');
  if (!SENDER_EMAIL) missing.push('SENDER_EMAIL');
  if (!SENDER_NAME) missing.push('SENDER_NAME');

  const isValid = missing.length === 0;

  if (!isValid) {
    console.warn(`[emailConfig] Missing required Brevo environment variables: ${missing.join(', ')}`);
  } else if (!BREVO_API_KEY.startsWith('xkeysib-')) {
    console.warn('[emailConfig] Warning: BREVO_API_KEY does not start with standard "xkeysib-" prefix.');
  }

  return { isValid, missing };
};

const validation = validateConfig();

module.exports = {
  apiKey: BREVO_API_KEY,
  senderEmail: SENDER_EMAIL,
  senderName: SENDER_NAME,
  isConfigured: validation.isValid,
  validateConfig
};
