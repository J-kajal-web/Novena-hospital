const Appointment = require('../models/Appointment');
const sendAppointmentEmail = require('../utils/sendAppointmentEmail');

const APPOINTMENT_STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function saveEmailStatusIfSupported(appointment, status) {
  if (!appointment || !appointment.schema.path('emailStatus')) {
    return;
  }

  try {
    appointment.emailStatus = status;
    await appointment.save();
  } catch (statusError) {
    console.error(`Appointment email status update failed (${status}):`, statusError);
  }
}

async function createAppointment(req, res) {
  try {
    const { department, doctor, date, time, name, email, phone, message } = req.body;

    if (!department || !doctor || !date || !time || !name || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all appointment form fields.'
      });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.'
      });
    }

    const appointment = await Appointment.create({
      department,
      doctor,
      date,
      time,
      name,
      email: email || '',
      phone,
      message
    });

    try {
      await sendAppointmentEmail(appointment);
      await saveEmailStatusIfSupported(appointment, 'sent');

      return res.status(201).json({
        success: true,
        message: 'Appointment booked successfully and email notification was sent.',
        appointment,
        appointmentId: appointment._id
      });
    } catch (emailError) {
      await saveEmailStatusIfSupported(appointment, 'failed');
      console.error('Appointment email sending failed:', emailError);

      return res.status(201).json({
        success: true,
        message: 'Appointment was saved successfully, but email notification failed.',
        appointment,
        appointmentId: appointment._id
      });
    }
  } catch (error) {
    console.error('Appointment creation error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Could not book the appointment right now.'
    });
  }
}

async function getAppointments(req, res) {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Fetch appointments error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Could not fetch appointments right now.'
    });
  }
}

async function updateAppointment(req, res) {
  try {
    const { id } = req.params;
    const updates = {};

    if (req.body.status !== undefined) {
      if (!APPOINTMENT_STATUSES.includes(req.body.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid appointment status.'
        });
      }

      updates.status = req.body.status;
    }

    const allowedFields = [
      'department',
      'doctor',
      'date',
      'time',
      'name',
      'phone',
      'message'
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.body.email !== undefined) {
      if (req.body.email && !isValidEmail(req.body.email)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid email address.'
        });
      }

      updates.email = req.body.email;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid appointment fields were provided for update.'
      });
    }

    const appointment = await Appointment.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Appointment updated successfully.',
      data: appointment
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment id.'
      });
    }

    console.error('Update appointment error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Could not update the appointment right now.'
    });
  }
}

async function deleteAppointment(req, res) {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByIdAndDelete(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully.'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment id.'
      });
    }

    console.error('Delete appointment error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Could not delete the appointment right now.'
    });
  }
}

module.exports = {
  createAppointment,
  getAppointments,
  updateAppointment,
  deleteAppointment
};
