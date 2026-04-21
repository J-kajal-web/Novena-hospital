const nodemailer = require('nodemailer');

function createTransporter() {
  const {
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_SECURE,
    EMAIL_USER,
    EMAIL_PASS
  } = process.env;

  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
    throw new Error('Email environment variables are missing.');
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: String(EMAIL_SECURE).toLowerCase() === 'true',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  });
}

async function sendContactEmail(contactData) {
  const transporter = createTransporter();
  const inboxEmail = process.env.EMAIL_TO || process.env.EMAIL_USER;

  const mailOptions = {
    from: `"Novena Hospital Website" <${process.env.EMAIL_USER}>`,
    to: inboxEmail,
    replyTo: contactData.email,
    subject: `New Contact Message: ${contactData.subject}`,
    text: [
      'New contact form submission',
      `Name: ${contactData.name}`,
      `Email: ${contactData.email}`,
      `Phone: ${contactData.phone}`,
      `Subject: ${contactData.subject}`,
      `Message: ${contactData.message}`
    ].join('\n'),
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${contactData.name}</p>
      <p><strong>Email:</strong> ${contactData.email}</p>
      <p><strong>Phone:</strong> ${contactData.phone}</p>
      <p><strong>Subject:</strong> ${contactData.subject}</p>
      <p><strong>Message:</strong></p>
      <p>${contactData.message}</p>
    `
  };

  return transporter.sendMail(mailOptions);
}

module.exports = sendContactEmail;
