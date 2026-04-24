const nodemailer = require('nodemailer');

function createTransporter() {
  const {
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_SECURE,
    EMAIL_USER,
    EMAIL_PASS
  } = process.env;

  const host = EMAIL_HOST ? EMAIL_HOST.trim() : '';
  const port = Number(String(EMAIL_PORT || '').trim());
  const secure = String(EMAIL_SECURE || '').trim().toLowerCase() === 'true';
  const user = EMAIL_USER ? EMAIL_USER.trim() : '';
  // Gmail app passwords are often copied with spaces between chunks.
  const pass = EMAIL_PASS ? EMAIL_PASS.replace(/\s+/g, '') : '';

  if (!host || !port || !user || !pass) {
    throw new Error('Email environment variables are missing.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  });
}

function formatValue(value) {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  const normalized = String(value).trim();
  return normalized || 'N/A';
}

function formatCreatedAt(createdAt) {
  if (!createdAt) {
    return new Date().toISOString();
  }

  const parsedDate = new Date(createdAt);
  return Number.isNaN(parsedDate.getTime()) ? formatValue(createdAt) : parsedDate.toISOString();
}

async function sendAppointmentEmail(appointmentData) {
  const transporter = createTransporter();
  const inboxEmail = process.env.EMAIL_TO || process.env.EMAIL_USER;

  const patientName = formatValue(appointmentData.name);
  const patientEmail = formatValue(appointmentData.email);
  const phone = formatValue(appointmentData.phone);
  const appointmentDate = formatValue(appointmentData.date);
  const appointmentTime = formatValue(appointmentData.time);
  const department = formatValue(appointmentData.department);
  const doctor = formatValue(appointmentData.doctor);
  const message = formatValue(appointmentData.message);
  const status = formatValue(appointmentData.status);
  const createdAt = formatCreatedAt(appointmentData.createdAt);

  const mailOptions = {
    from: `"Novena Hospital Website" <${process.env.EMAIL_USER}>`,
    to: inboxEmail,
    subject: `New Appointment Booking: ${patientName}`,
    text: [
      'New appointment booking submission',
      `Patient Name: ${patientName}`,
      `Email: ${patientEmail}`,
      `Phone: ${phone}`,
      `Appointment Date: ${appointmentDate}`,
      `Appointment Time: ${appointmentTime}`,
      `Department: ${department}`,
      `Doctor: ${doctor}`,
      `Message: ${message}`,
      `Status: ${status}`,
      `Created At: ${createdAt}`
    ].join('\n'),
    html: `
      <h2>New Appointment Booking</h2>
      <p><strong>Patient Name:</strong> ${patientName}</p>
      <p><strong>Email:</strong> ${patientEmail}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Appointment Date:</strong> ${appointmentDate}</p>
      <p><strong>Appointment Time:</strong> ${appointmentTime}</p>
      <p><strong>Department:</strong> ${department}</p>
      <p><strong>Doctor:</strong> ${doctor}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
      <p><strong>Status:</strong> ${status}</p>
      <p><strong>Created At:</strong> ${createdAt}</p>
    `
  };

  if (patientEmail !== 'N/A') {
    mailOptions.replyTo = appointmentData.email;
  }

  return transporter.sendMail(mailOptions);
}

module.exports = sendAppointmentEmail;
