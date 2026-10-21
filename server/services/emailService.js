/**
 * emailService.js — Production-ready Brevo (Sendinblue) Transactional Email Service
 * Powered by official @getbrevo/brevo SDK
 */

const { BrevoClient } = require('@getbrevo/brevo');
const config = require('../config/emailConfig');

// Initialize Brevo Transactional Email Client with auto-retry and 30s timeout
const brevo = new BrevoClient({
  apiKey: config.apiKey,
  timeoutInSeconds: 30,
  maxRetries: 3
});

const getClientUrl = () => {
  return (process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
};

/**
 * Normalizes 'to' recipient input into Brevo format [{ email: string, name?: string }]
 */
const normalizeRecipients = (to, defaultName = '') => {
  if (typeof to === 'string') {
    return [{ email: to.trim(), name: defaultName || to.split('@')[0] }];
  }
  if (Array.isArray(to)) {
    return to.map((item) => {
      if (typeof item === 'string') {
        return { email: item.trim(), name: defaultName || item.split('@')[0] };
      }
      return { email: item.email.trim(), name: item.name || defaultName };
    });
  }
  if (typeof to === 'object' && to.email) {
    return [{ email: to.email.trim(), name: to.name || defaultName }];
  }
  throw new Error('Invalid email recipient format. Expected string, array, or { email, name } object.');
};

/**
 * Parses and classifies Brevo API errors with user-friendly diagnostics
 */
const formatBrevoError = (err) => {
  const statusCode = err.statusCode || err.status || (err.response && err.response.status);
  let rawBody = err.body || (err.response && err.response.data) || err.message;

  let parsedMessage = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);

  let resolution = 'Please check your Brevo account dashboard.';
  if (statusCode === 401) {
    if (parsedMessage.includes('unrecognised IP') || parsedMessage.includes('authorised_ips')) {
      resolution = 'IP Whitelist Notice: Brevo requires authorizing your current IP at https://app.brevo.com/security/authorised_ips';
    } else {
      resolution = 'Invalid Brevo API key. Please verify BREVO_API_KEY in your .env file.';
    }
  } else if (statusCode === 429) {
    resolution = 'Brevo rate limit reached. Backing off before retrying.';
  } else if (statusCode === 400) {
    resolution = 'Bad Request: Verify recipient email syntax and sender domain configuration.';
  }

  const enhancedError = new Error(`Brevo Email Error [${statusCode || 'UNKNOWN'}]: ${err.message}`);
  enhancedError.statusCode = statusCode;
  enhancedError.details = rawBody;
  enhancedError.resolution = resolution;
  return enhancedError;
};

// ==========================================
// 1. CORE / BASE METHODS
// ==========================================

/**
 * Sends a custom transactional email via Brevo
 * @param {Object} options
 * @param {string|Array} options.to - Recipient(s)
 * @param {string} options.subject - Email subject line
 * @param {string} options.htmlContent - HTML body content
 * @param {string} [options.textContent] - Fallback plain text
 * @param {Object} [options.params] - Dynamic template parameters
 * @param {Object} [options.replyTo] - Custom reply-to { email, name }
 * @param {string[]} [options.tags] - Categorization tags
 */
const sendEmail = async ({
  to,
  subject,
  htmlContent,
  textContent = '',
  params = {},
  replyTo = null,
  tags = []
}) => {
  const recipients = normalizeRecipients(to);
  const sender = { email: config.senderEmail, name: config.senderName };

  const payload = {
    sender,
    to: recipients,
    subject,
    htmlContent,
    textContent: textContent || htmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  };

  if (params && Object.keys(params).length > 0) payload.params = params;
  if (tags && tags.length > 0) payload.tags = tags;
  if (replyTo) {
    payload.replyTo = typeof replyTo === 'string' ? { email: replyTo } : replyTo;
  } else {
    payload.replyTo = sender;
  }

  try {
    const result = await brevo.transactionalEmails.sendTransacEmail(payload);
    console.log(`[Brevo EmailService] ✅ Email sent to ${recipients.map(r => r.email).join(', ')} (Message ID: ${result?.messageId || 'OK'})`);
    return {
      success: true,
      messageId: result?.messageId,
      result
    };
  } catch (err) {
    const formatted = formatBrevoError(err);
    console.error(`[Brevo EmailService] ❌ Failed to send email to ${recipients.map(r => r.email).join(', ')}:`, formatted.message);
    if (formatted.resolution) {
      console.warn(`[Brevo EmailService] 💡 Resolution hint: ${formatted.resolution}`);
    }
    throw formatted;
  }
};

/**
 * Sends a transactional email using a pre-configured Brevo template ID
 * @param {Object} options
 * @param {string|Array} options.to
 * @param {number} options.templateId
 * @param {Object} [options.params]
 * @param {string} [options.subject]
 * @param {Object} [options.replyTo]
 */
const sendTemplateEmail = async ({ to, templateId, params = {}, subject = null, replyTo = null }) => {
  const recipients = normalizeRecipients(to);
  const sender = { email: config.senderEmail, name: config.senderName };

  const payload = {
    sender,
    to: recipients,
    templateId: Number(templateId),
    params
  };

  if (subject) payload.subject = subject;
  if (replyTo) payload.replyTo = typeof replyTo === 'string' ? { email: replyTo } : replyTo;

  try {
    const result = await brevo.transactionalEmails.sendTransacEmail(payload);
    console.log(`[Brevo EmailService] ✅ Template email #${templateId} sent to ${recipients.map(r => r.email).join(', ')}`);
    return { success: true, messageId: result?.messageId, result };
  } catch (err) {
    const formatted = formatBrevoError(err);
    console.error(`[Brevo EmailService] ❌ Template #${templateId} error:`, formatted.message);
    throw formatted;
  }
};

// ==========================================
// 2. HIGH-LEVEL WRAPPER FUNCTIONS
// ==========================================

/**
 * Helper to safely extract a primitive string OTP / Token from any input
 * (Prevents accidental concatenation of query strings like "token=482910&email=...")
 */
const sanitizePrimitiveOTP = (input) => {
  if (input === null || input === undefined) return '';
  if (typeof input === 'number') return String(input);
  if (typeof input === 'object') {
    const raw = input.otp || input.token || input.code || '';
    return sanitizePrimitiveOTP(raw);
  }

  const str = String(input).trim();
  // If a full URL or query string was passed, extract purely the token/otp value
  if (str.includes('token=') || str.includes('otp=') || str.startsWith('http://') || str.startsWith('https://')) {
    try {
      const parsedUrl = new URL(str.startsWith('http') ? str : `http://localhost/?${str}`);
      const paramVal = parsedUrl.searchParams.get('token') || parsedUrl.searchParams.get('otp');
      if (paramVal) return paramVal.split('&')[0].trim();
    } catch {
      // Fallback regex extraction
      const match = str.match(/[?&](?:token|otp)=([^&]+)/i);
      if (match && match[1]) return decodeURIComponent(match[1]);
    }
  }

  // Strip any trailing query parameters or prefix
  return str.split('&')[0].replace(/^.*=/, '').trim();
};

/**
 * 1. Dedicated OTP Email Dispatcher
 * Sends a clean, primitive OTP code to the user, completely decoupled from email parameter
 * @param {string} email - Recipient email
 * @param {string|number} otp - Clean primitive OTP code (e.g., "482910")
 * @param {string} [userName] - Recipient name
 * @param {number|null} [templateId] - Optional Brevo template ID
 */
const sendOTPEmail = async (email, otp, userName = 'Movie Enthusiast', templateId = null) => {
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : (email?.email || '').trim().toLowerCase();
  const cleanOtp = sanitizePrimitiveOTP(otp);
  const cleanName = userName || cleanEmail.split('@')[0];
  const cleanActionUrl = `${getClientUrl()}/verify?token=${encodeURIComponent(cleanOtp)}&email=${encodeURIComponent(cleanEmail)}`;

  // Decoupled clean parameters for Brevo
  const decoupledParams = {
    OTP: cleanOtp,
    otp: cleanOtp,
    email: cleanEmail,
    name: cleanName,
    actionUrl: cleanActionUrl
  };

  if (templateId) {
    return sendTemplateEmail({
      to: cleanEmail,
      templateId,
      params: decoupledParams,
      subject: `🎬 Your iMovies Verification Code: ${cleanOtp}`
    });
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Your iMovies Verification Code</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #050507; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #050507; padding: 40px 15px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="580" style="max-width: 580px; background-color: #0f0f13; border: 1px solid #27272a; padding: 0;">
              <!-- Header -->
              <tr>
                <td style="padding: 30px; background-color: #141419; border-bottom: 2px solid #ff6600; text-align: center;">
                  <h1 style="margin: 0; color: #ff6600; font-size: 28px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">🎬 iMovies</h1>
                  <p style="margin: 5px 0 0; color: #a1a1aa; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Account Security & Activation</p>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 35px 30px;">
                  <h2 style="margin: 0 0 15px; color: #ffffff; font-size: 20px; font-weight: 700;">Hello ${cleanName},</h2>
                  <p style="margin: 0 0 20px; color: #d4d4d8; font-size: 15px; line-height: 1.6;">
                    Here is your single-use verification code to activate your iMovies account:
                  </p>

                  <!-- Clean Primitive OTP Code Box -->
                  <div style="background-color: #18181b; border: 2px dashed #ff6600; padding: 22px 15px; margin: 25px 0; text-align: center;">
                    <p style="margin: 0 0 8px; color: #a1a1aa; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">One-Time Verification Code (OTP)</p>
                    <span style="font-family: monospace, 'Courier New', Courier; font-size: 32px; color: #ff6600; font-weight: 900; letter-spacing: 8px;">${cleanOtp}</span>
                  </div>

                  <!-- Direct Link -->
                  <div style="text-align: center; margin: 25px 0;">
                    <a href="${cleanActionUrl}" target="_blank" style="display: inline-block; background-color: #ff6600; color: #000000; font-weight: 800; font-size: 14px; padding: 12px 30px; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">
                      Verify Automatically
                    </a>
                  </div>

                  <p style="margin: 25px 0 0; color: #71717a; font-size: 13px; line-height: 1.5;">
                    This code is valid for <strong>15 minutes</strong>. If you did not request this email, please safely disregard it.<br>
                    <span style="color: #a1a1aa;">Didn't receive the email? Please check your spam or junk folder.</span>
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 30px; background-color: #0a0a0d; border-top: 1px solid #1f1f23; text-align: center; color: #71717a; font-size: 12px;">
                  &copy; ${new Date().getFullYear()} iMovies Entertainment Ltd. All rights reserved.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to: cleanEmail,
    subject: `🎬 Your iMovies Verification Code: ${cleanOtp}`,
    htmlContent,
    params: decoupledParams,
    tags: ['auth', 'otp', 'verification']
  });
};

/**
 * 2. Account Verification / Activation Email
 * Sends a modern, black-and-orange branded verification email with decoupled primitive OTP and action link
 */
const sendVerificationEmail = async (email, verificationTokenOrLink, userName = 'Movie Enthusiast', customActionUrl = null) => {
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : (email?.email || '').trim().toLowerCase();
  const cleanOtp = sanitizePrimitiveOTP(verificationTokenOrLink);
  const cleanName = userName || cleanEmail.split('@')[0];

  const actionUrl = customActionUrl || (
    typeof verificationTokenOrLink === 'string' && (verificationTokenOrLink.startsWith('http://') || verificationTokenOrLink.startsWith('https://'))
      ? verificationTokenOrLink
      : `${getClientUrl()}/verify?token=${encodeURIComponent(cleanOtp)}&email=${encodeURIComponent(cleanEmail)}`
  );

  // Decoupled clean parameters for Brevo
  const decoupledParams = {
    OTP: cleanOtp,
    otp: cleanOtp,
    email: cleanEmail,
    name: cleanName,
    actionUrl
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Verify Your iMovies Account</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #050507; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #050507; padding: 40px 15px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="580" style="max-width: 580px; background-color: #0f0f13; border: 1px solid #27272a; padding: 0;">
              <!-- Header -->
              <tr>
                <td style="padding: 30px; background-color: #141419; border-bottom: 2px solid #ff6600; text-align: center;">
                  <h1 style="margin: 0; color: #ff6600; font-size: 28px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">🎬 iMovies</h1>
                  <p style="margin: 5px 0 0; color: #a1a1aa; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Premier Cinema Experience</p>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 35px 30px;">
                  <h2 style="margin: 0 0 15px; color: #ffffff; font-size: 20px; font-weight: 700;">Welcome to iMovies, ${cleanName}!</h2>
                  <p style="margin: 0 0 20px; color: #d4d4d8; font-size: 15px; line-height: 1.6;">
                    Thank you for creating your iMovies account. Please verify your email address to unlock instant movie ticket booking, real-time seat selection, and exclusive theatrical offers.
                  </p>

                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${actionUrl}" target="_blank" style="display: inline-block; background-color: #ff6600; color: #000000; font-weight: 800; font-size: 15px; padding: 14px 34px; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">
                      Verify Email Address
                    </a>
                  </div>

                  <!-- Token fallback -->
                  <div style="background-color: #18181b; border: 1px solid #27272a; padding: 15px; margin-top: 25px; text-align: center;">
                    <p style="margin: 0 0 6px; color: #a1a1aa; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Verification Code (OTP)</p>
                    <code style="font-family: monospace; font-size: 24px; color: #ff6600; font-weight: 800; letter-spacing: 6px;">${cleanOtp}</code>
                  </div>

                  <p style="margin: 25px 0 0; color: #71717a; font-size: 13px; line-height: 1.5;">
                    This verification link will expire in 24 hours. If you did not sign up for an iMovies account, please safely disregard this email.<br>
                    <span style="color: #a1a1aa;">Didn't receive the email? Please check your spam or junk folder.</span>
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 30px; background-color: #0a0a0d; border-top: 1px solid #1f1f23; text-align: center; color: #71717a; font-size: 12px;">
                  &copy; ${new Date().getFullYear()} iMovies Entertainment Ltd. All rights reserved.<br>
                  Sent securely via Brevo Transactional Mail.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to: cleanEmail,
    subject: `🎬 Verify Your iMovies Account (${cleanOtp})`,
    htmlContent,
    params: decoupledParams,
    tags: ['auth', 'verification']
  });
};

/**
 * 3. Password Reset Email
 * Sends a secure password recovery link to the user with clean decoupled tokens
 */
const sendPasswordResetEmail = async (email, resetTokenOrLink, userName = 'Movie Lover', customActionUrl = null) => {
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : (email?.email || '').trim().toLowerCase();
  const cleanToken = sanitizePrimitiveOTP(resetTokenOrLink);
  const cleanName = userName || cleanEmail.split('@')[0];

  const actionUrl = customActionUrl || (
    typeof resetTokenOrLink === 'string' && (resetTokenOrLink.startsWith('http://') || resetTokenOrLink.startsWith('https://'))
      ? resetTokenOrLink
      : `${getClientUrl()}/reset-password?token=${encodeURIComponent(cleanToken)}&email=${encodeURIComponent(cleanEmail)}`
  );

  const decoupledParams = {
    token: cleanToken,
    resetToken: cleanToken,
    OTP: cleanToken,
    email: cleanEmail,
    name: cleanName,
    actionUrl
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Reset Your iMovies Password</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #050507; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #050507; padding: 40px 15px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="580" style="max-width: 580px; background-color: #0f0f13; border: 1px solid #27272a; padding: 0;">
              <!-- Header -->
              <tr>
                <td style="padding: 30px; background-color: #141419; border-bottom: 2px solid #ff6600; text-align: center;">
                  <h1 style="margin: 0; color: #ff6600; font-size: 28px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">🎬 iMovies</h1>
                  <p style="margin: 5px 0 0; color: #a1a1aa; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Security & Account Recovery</p>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 35px 30px;">
                  <h2 style="margin: 0 0 15px; color: #ffffff; font-size: 20px; font-weight: 700;">Password Reset Request</h2>
                  <p style="margin: 0 0 20px; color: #d4d4d8; font-size: 15px; line-height: 1.6;">
                    Hello ${userName}, we received a request to reset your password for your iMovies account. Click the button below to choose a new password.
                  </p>

                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${actionUrl}" target="_blank" style="display: inline-block; background-color: #ff6600; color: #000000; font-weight: 800; font-size: 15px; padding: 14px 34px; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">
                      Reset Password
                    </a>
                  </div>

                  <p style="margin: 25px 0 0; color: #71717a; font-size: 13px; line-height: 1.5;">
                    <strong>Security Notice:</strong> This reset link expires in <strong>1 hour</strong>. If you did not request a password reset, no further action is required and your account remains completely secure.<br>
                    <span style="color: #a1a1aa;">Didn't receive the email? Please check your spam or junk folder.</span>
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 30px; background-color: #0a0a0d; border-top: 1px solid #1f1f23; text-align: center; color: #71717a; font-size: 12px;">
                  &copy; ${new Date().getFullYear()} iMovies Entertainment Ltd. All rights reserved.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to: cleanEmail,
    subject: '🔐 Reset Your iMovies Password',
    htmlContent,
    params: decoupledParams,
    tags: ['auth', 'password-reset']
  });
};

/**
 * 3. Booking Confirmation Email
 * Sends a digital cinema ticket receipt with booking ID, movie name, theatre, seats, and amount
 */
const sendBookingConfirmationEmail = async (email, bookingDetails = {}) => {
  const {
    bookingId = 'IMV-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    movieName = 'Blockbuster Cinema',
    theatreName = 'iMovies Grand Cineplex',
    location = 'India',
    showDate = new Date().toISOString().split('T')[0],
    showTime = '07:30 PM',
    selectedSeats = ['A1'],
    totalAmount = 250,
    ticketPrice = null,
    userName = 'Movie Fan'
  } = bookingDetails;

  const seatsList = Array.isArray(selectedSeats) ? selectedSeats.join(', ') : selectedSeats;
  const seatsCount = Array.isArray(selectedSeats) ? selectedSeats.length : 1;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>iMovies Booking Confirmed</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #050507; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #050507; padding: 40px 15px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" style="max-width: 600px; background-color: #0f0f13; border: 1px solid #27272a; padding: 0;">
              <!-- Header -->
              <tr>
                <td style="padding: 25px 30px; background-color: #141419; border-bottom: 2px solid #ff6600; text-align: center;">
                  <h1 style="margin: 0; color: #ff6600; font-size: 28px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">🎬 iMovies</h1>
                  <p style="margin: 5px 0 0; color: #a1a1aa; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Official E-Ticket & Receipt</p>
                </td>
              </tr>
              <!-- Hero Status -->
              <tr>
                <td style="padding: 25px 30px 15px; text-align: center; background-color: #18181f; border-bottom: 1px dashed #27272a;">
                  <span style="display: inline-block; padding: 4px 12px; background-color: #ff6600; color: #000000; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
                    Booking Confirmed
                  </span>
                  <h2 style="margin: 5px 0 0; font-size: 24px; color: #ffffff; text-transform: uppercase; font-weight: 800;">${movieName}</h2>
                  <p style="margin: 5px 0 0; color: #ff6600; font-size: 14px; font-weight: 600;">Booking ID: ${bookingId}</p>
                </td>
              </tr>
              <!-- Ticket Details Table -->
              <tr>
                <td style="padding: 30px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; color: #d4d4d8;">
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #27272a; color: #a1a1aa; width: 40%;">Theatre:</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #27272a; font-weight: 700; color: #ffffff; text-align: right;">${theatreName} (${location})</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #27272a; color: #a1a1aa;">Show Date:</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #27272a; font-weight: 700; color: #ffffff; text-align: right;">${showDate}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #27272a; color: #a1a1aa;">Showtime:</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #27272a; font-weight: 700; color: #ffffff; text-align: right;">${showTime}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #27272a; color: #a1a1aa;">Seats (${seatsCount}):</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #27272a; font-weight: 800; color: #ff6600; text-align: right; letter-spacing: 1px;">${seatsList}</td>
                    </tr>
                    <tr>
                      <td style="padding: 16px 0 0; font-size: 16px; font-weight: 700; color: #ffffff;">Total Amount Paid:</td>
                      <td style="padding: 16px 0 0; font-size: 22px; font-weight: 900; color: #ff6600; text-align: right;">₹${totalAmount}</td>
                    </tr>
                  </table>

                  <!-- Cinema Notice Box -->
                  <div style="background-color: #141419; border-left: 3px solid #ff6600; padding: 14px 18px; margin-top: 30px;">
                    <p style="margin: 0; color: #d4d4d8; font-size: 13px; line-height: 1.5;">
                      🎟️ <strong>Admissions Notice:</strong> Please display this digital e-ticket or quote your Booking ID (<strong>${bookingId}</strong>) at the theatre gate. We recommend arriving at least 15 minutes prior to showtime.
                    </p>
                    <p style="margin: 8px 0 0; color: #a1a1aa; font-size: 12px;">
                      Didn't receive the email? Please check your spam or junk folder.
                    </p>
                  </div>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 30px; background-color: #0a0a0d; border-top: 1px solid #1f1f23; text-align: center; color: #71717a; font-size: 12px;">
                  Enjoy your film with iMovies! 🍿<br>
                  Questions? Reply directly to this email or visit our help desk.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `🎬 iMovies Booking Confirmed: ${movieName} (${bookingId})`,
    htmlContent,
    tags: ['booking', 'confirmation']
  });
};

module.exports = {
  brevoClient: brevo,
  sendEmail,
  sendTemplateEmail,
  sendOTPEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail
};
