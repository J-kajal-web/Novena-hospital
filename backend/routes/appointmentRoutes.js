const express = require('express');
const {
  createAppointment,
  getAppointments,
  updateAppointment,
  deleteAppointment
} = require('../controllers/appointmentController');

const router = express.Router();

router.route('/').post(createAppointment).get(getAppointments);
router.route('/:id').put(updateAppointment).delete(deleteAppointment);

module.exports = router;
