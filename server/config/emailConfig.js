/**
 * Centralized Email Configuration
 * Validates and exposes Brevo (Sendinblue) transactional email settings.
 */

require("dotenv").config();

const emailConfig = {
  apiKey: process.env.BREVO_API_KEY || "",
  senderEmail: process.env.SENDER_EMAIL || "en24cs3010863@medicaps.ac.in",
  senderName: process.env.SENDER_NAME || "iMovies",
  clientUrl: process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173",

  /**
   * Dynamically resolves the frontend client URL:
   * 1. Inspects req.headers.origin or req.headers.referer from the incoming request (e.g. live Vercel domain).
   * 2. Checks process.env.CLIENT_URL or process.env.FRONTEND_URL (if non-localhost).
   * 3. Checks process.env.VERCEL_URL.
   * 4. Falls back to process.env.CLIENT_URL or request origin or localhost.
   */
  getClientUrl(req) {
    if (req) {
      const origin = req.get ? (req.get("origin") || req.get("referer")) : (req.headers && (req.headers.origin || req.headers.referer));
      if (origin) {
        try {
          const parsed = new URL(origin);
          // If the request comes from a live domain (like .vercel.app or a custom domain), use it immediately!
          if (!parsed.hostname.includes("localhost") && !parsed.hostname.includes("127.0.0.1")) {
            return parsed.origin.replace(/\/+$/, "");
          }
        } catch (e) {
          // not a full url, fallback
        }
      }
    }

    if (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes("localhost")) {
      return process.env.CLIENT_URL.replace(/\/+$/, "");
    }
    if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes("localhost")) {
      return process.env.FRONTEND_URL.replace(/\/+$/, "");
    }
    if (process.env.VERCEL_URL) {
      const vUrl = process.env.VERCEL_URL.startsWith("http")
        ? process.env.VERCEL_URL
        : `https://${process.env.VERCEL_URL}`;
      return vUrl.replace(/\/+$/, "");
    }

    // If request has origin even on localhost, use it
    if (req) {
      const origin = req.get ? req.get("origin") : req.headers?.origin;
      if (origin) return origin.replace(/\/+$/, "");
    }

    return (this.clientUrl || process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");
  },

  /**
   * Validate required environment variables.
   * Throws detailed error if configuration is incomplete.
   */
  validateConfig() {
    const missing = [];
    if (!this.apiKey) missing.push("BREVO_API_KEY");
    if (!this.senderEmail) missing.push("SENDER_EMAIL");

    if (missing.length > 0) {
      console.warn(`[EmailConfig] ⚠️ Missing email configuration: ${missing.join(", ")}`);
      return false;
    }
    return true;
  },

  isConfigured() {
    return Boolean(this.apiKey && this.senderEmail);
  },
};

module.exports = emailConfig;
