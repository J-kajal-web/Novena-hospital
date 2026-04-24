/**
 * WhatsApp Notification Utility
 * Uses Twilio WhatsApp API to send notifications
 */

const twilio = require('twilio');

/**
 * Initialize Twilio client
 * @returns {Object|null} Twilio client or null if not configured
 */
function getTwilioClient() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.warn('[WhatsApp] Twilio credentials not configured. WhatsApp notifications disabled.');
    return null;
  }

  try {
    return twilio(TWILIO_ACCOUNT_SID.trim(), TWILIO_AUTH_TOKEN.trim());
  } catch (error) {
    console.error('[WhatsApp] Failed to initialize Twilio client:', error.message);
    return null;
  }
}

/**
 * Get configured WhatsApp sender number
 * @returns {string|null} WhatsApp from number or null
 */
function getWhatsAppFrom() {
  const { TWILIO_WHATSAPP_FROM } = process.env;

  if (!TWILIO_WHATSAPP_FROM) {
    console.warn('[WhatsApp] TWILIO_WHATSAPP_FROM not configured.');
    return null;
  }

  return TWILIO_WHATSAPP_FROM.trim();
}

/**
 * Get admin WhatsApp number
 * @returns {string|null} Admin phone number or null
 */
function getAdminWhatsAppNumber() {
  const { ADMIN_WHATSAPP_NUMBER } = process.env;

  if (!ADMIN_WHATSAPP_NUMBER) {
    console.warn('[WhatsApp] ADMIN_WHATSAPP_NUMBER not configured.');
    return null;
  }

  return ADMIN_WHATSAPP_NUMBER.trim();
}

/**
 * Strip an optional whatsapp: prefix.
 * @param {string} value - Raw number/address
 * @returns {string} Prefix-free value
 */
function stripWhatsAppPrefix(value) {
  const trimmed = String(value || '').trim();
  return trimmed.toLowerCase().startsWith('whatsapp:')
    ? trimmed.slice('whatsapp:'.length).trim()
    : trimmed;
}

/**
 * Format phone number for WhatsApp (add country code if missing).
 * Assumes India (+91) only for 10-digit local numbers.
 * @param {string} phone - Phone number
 * @returns {string|null} Formatted phone number or null when invalid
 */
function formatPhoneForWhatsApp(phone) {
  const normalized = stripWhatsAppPrefix(phone);
  if (!normalized) {
    return null;
  }

  const cleaned = normalized.replace(/\D/g, '');
  if (!cleaned) {
    return null;
  }

  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }

  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }

  return null;
}

/**
 * Ensure value is in Twilio WhatsApp address format: whatsapp:+1234567890.
 * @param {string} value - Raw number/address
 * @param {boolean} assumeIndiaForTenDigits - Apply +91 for 10-digit values
 * @returns {string|null} Normalized WhatsApp address
 */
function normalizeWhatsAppAddress(value, assumeIndiaForTenDigits = false) {
  const stripped = stripWhatsAppPrefix(value);
  if (!stripped) {
    return null;
  }

  let formattedPhone = null;

  if (stripped.startsWith('+')) {
    const digits = stripped.replace(/\D/g, '');
    if (digits.length >= 10) {
      formattedPhone = `+${digits}`;
    }
  } else {
    const digitsOnly = stripped.replace(/\D/g, '');

    if (digitsOnly.length > 10) {
      formattedPhone = `+${digitsOnly}`;
    } else if (assumeIndiaForTenDigits && digitsOnly.length === 10) {
      formattedPhone = `+91${digitsOnly}`;
    }
  }

  return formattedPhone ? `whatsapp:${formattedPhone}` : null;
}

/**
 * Send WhatsApp message via Twilio
 * @param {string} to - Recipient phone number
 * @param {string} body - Message body
 * @param {string} type - Type of message (for logging)
 * @returns {Object} Result object with success status
 */
async function sendWhatsAppMessage(to, body, type = 'message') {
  const client = getTwilioClient();
  const fromNumber = getWhatsAppFrom();

  if (!client || !fromNumber) {
    return {
      success: false,
      error: 'WhatsApp not configured',
      skipped: true
    };
  }

  const whatsappTo = normalizeWhatsAppAddress(to, true);
  const whatsappFrom = normalizeWhatsAppAddress(fromNumber, false);

  if (!whatsappTo) {
    return {
      success: false,
      error: 'Invalid recipient phone number'
    };
  }

  if (!whatsappFrom) {
    return {
      success: false,
      error: 'Invalid TWILIO_WHATSAPP_FROM format'
    };
  }

  try {
    console.log(`[WhatsApp] Sending ${type} to ${whatsappTo}...`);

    const message = await client.messages.create({
      body,
      from: whatsappFrom,
      to: whatsappTo
    });

    console.log(`[WhatsApp] ${type} sent successfully. SID: ${message.sid}`);

    return {
      success: true,
      sid: message.sid,
      status: message.status
    };
  } catch (error) {
    console.error(`[WhatsApp] Failed to send ${type}:`, error.message);

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send WhatsApp notification to admin about new contact form submission
 * @param {Object} contactData - Contact form data
 * @returns {Object} Result object
 */
async function sendContactAdminNotification(contactData) {
  const adminNumber = getAdminWhatsAppNumber();

  if (!adminNumber) {
    return { success: false, error: 'Admin number not configured', skipped: true };
  }

  const message = `*New Contact Form Submission*\n\n`
    + `*Name:* ${contactData.name}\n`
    + `*Email:* ${contactData.email}\n`
    + `*Phone:* ${contactData.phone}\n`
    + `*Subject:* ${contactData.subject}\n`
    + `*Message:* ${contactData.message}`;

  return sendWhatsAppMessage(adminNumber, message, 'contact-admin-notification');
}

/**
 * Send auto-reply WhatsApp confirmation to contact form submitter
 * @param {Object} contactData - Contact form data
 * @returns {Object} Result object
 */
async function sendContactAutoReply(contactData) {
  const message = `Hello ${contactData.name}!\n\n`
    + `Thank you for contacting Novena Hospital.\n\n`
    + `We have received your message and will get back to you within 24-48 hours.\n\n`
    + `For urgent inquiries, please call our helpline.\n\n`
    + `Best regards,\n`
    + `Novena Hospital Team`;

  return sendWhatsAppMessage(contactData.phone, message, 'contact-auto-reply');
}

/**
 * Send WhatsApp notification to admin about new appointment
 * @param {Object} appointmentData - Appointment data
 * @returns {Object} Result object
 */
async function sendAppointmentAdminNotification(appointmentData) {
  const adminNumber = getAdminWhatsAppNumber();

  if (!adminNumber) {
    return { success: false, error: 'Admin number not configured', skipped: true };
  }

  const message = `*New Appointment Request*\n\n`
    + `*Patient:* ${appointmentData.name}\n`
    + `*Phone:* ${appointmentData.phone}\n`
    + `*Email:* ${appointmentData.email || 'N/A'}\n`
    + `*Department:* ${appointmentData.department}\n`
    + `*Doctor:* ${appointmentData.doctor}\n`
    + `*Date:* ${appointmentData.date}\n`
    + `*Time:* ${appointmentData.time}\n`
    + `*Message:* ${appointmentData.message}`;

  return sendWhatsAppMessage(adminNumber, message, 'appointment-admin-notification');
}

/**
 * Send WhatsApp confirmation to patient about their appointment
 * @param {Object} appointmentData - Appointment data
 * @returns {Object} Result object
 */
async function sendAppointmentConfirmation(appointmentData) {
  const message = `Hello ${appointmentData.name}!\n\n`
    + `Thank you for visiting our site. Your appointment request has been received.\n\n`
    + `*Appointment Details:*\n`
    + `- Department: ${appointmentData.department}\n`
    + `- Doctor: ${appointmentData.doctor}\n`
    + `- Date: ${appointmentData.date}\n`
    + `- Time: ${appointmentData.time}\n\n`
    + `Our team will contact you shortly to confirm your appointment.\n\n`
    + `Best regards,\n`
    + `Novena Hospital Team`;

  return sendWhatsAppMessage(appointmentData.phone, message, 'appointment-confirmation');
}

/**
 * Send both admin notification and patient confirmation for contact form
 * @param {Object} contactData - Contact form data
 * @returns {Object} Combined result
 */
async function sendContactWhatsAppNotifications(contactData) {
  const results = {
    admin: null,
    autoReply: null
  };

  try {
    results.admin = await sendContactAdminNotification(contactData);
  } catch (error) {
    console.error('[WhatsApp] Contact admin notification error:', error.message);
    results.admin = { success: false, error: error.message };
  }

  try {
    results.autoReply = await sendContactAutoReply(contactData);
  } catch (error) {
    console.error('[WhatsApp] Contact auto-reply error:', error.message);
    results.autoReply = { success: false, error: error.message };
  }

  return results;
}

/**
 * Send both admin notification and patient confirmation for appointment
 * @param {Object} appointmentData - Appointment data
 * @returns {Object} Combined result
 */
async function sendAppointmentWhatsAppNotifications(appointmentData) {
  const results = {
    admin: null,
    confirmation: null
  };

  try {
    results.admin = await sendAppointmentAdminNotification(appointmentData);
  } catch (error) {
    console.error('[WhatsApp] Appointment admin notification error:', error.message);
    results.admin = { success: false, error: error.message };
  }

  try {
    results.confirmation = await sendAppointmentConfirmation(appointmentData);
  } catch (error) {
    console.error('[WhatsApp] Appointment confirmation error:', error.message);
    results.confirmation = { success: false, error: error.message };
  }

  return results;
}

module.exports = {
  getTwilioClient,
  getWhatsAppFrom,
  getAdminWhatsAppNumber,
  formatPhoneForWhatsApp,
  normalizeWhatsAppAddress,
  sendWhatsAppMessage,
  sendContactAdminNotification,
  sendContactAutoReply,
  sendAppointmentAdminNotification,
  sendAppointmentConfirmation,
  sendContactWhatsAppNotifications,
  sendAppointmentWhatsAppNotifications
};
