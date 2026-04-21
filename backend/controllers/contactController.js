const ContactMessage = require('../models/ContactMessage');
const sendContactEmail = require('../utils/sendContactEmail');

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function submitContactForm(req, res) {
  try {
    const { name, email, subject, phone, message } = req.body;

    if (!name || !email || !subject || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all contact form fields.'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.'
      });
    }

    const savedMessage = await ContactMessage.create({
      name,
      email,
      subject,
      phone,
      message
    });

    try {
      await sendContactEmail(savedMessage);
      savedMessage.emailStatus = 'sent';
      await savedMessage.save();
    } catch (emailError) {
      savedMessage.emailStatus = 'failed';
      await savedMessage.save();

      console.error('Email sending failed:', emailError.message);

      return res.status(500).json({
        success: false,
        message:
          'Your message was saved, but the email could not be sent. Please check the email settings.'
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully.',
      data: savedMessage
    });
  } catch (error) {
    console.error('Contact form error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Could not submit the contact form right now.'
    });
  }
}

async function getContactMessages(req, res) {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Fetch contact messages error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Could not fetch contact messages right now.'
    });
  }
}

async function updateContactMessage(req, res) {
  try {
    const { id } = req.params;
    const updates = {};

    if (req.body.reviewed !== undefined) {
      if (typeof req.body.reviewed !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'The reviewed field must be true or false.'
        });
      }

      updates.reviewed = req.body.reviewed;
    }

    if (req.body.emailStatus !== undefined) {
      const allowedEmailStatus = ['pending', 'sent', 'failed'];

      if (!allowedEmailStatus.includes(req.body.emailStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email status value.'
        });
      }

      updates.emailStatus = req.body.emailStatus;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid contact fields were provided for update.'
      });
    }

    const message = await ContactMessage.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Contact message updated successfully.',
      data: message
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact message id.'
      });
    }

    console.error('Update contact message error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Could not update the contact message right now.'
    });
  }
}

async function deleteContactMessage(req, res) {
  try {
    const { id } = req.params;

    const message = await ContactMessage.findByIdAndDelete(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Contact message deleted successfully.'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact message id.'
      });
    }

    console.error('Delete contact message error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Could not delete the contact message right now.'
    });
  }
}

module.exports = {
  submitContactForm,
  getContactMessages,
  updateContactMessage,
  deleteContactMessage
};
