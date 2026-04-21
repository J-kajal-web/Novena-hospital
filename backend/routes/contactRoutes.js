const express = require('express');
const {
  submitContactForm,
  getContactMessages,
  updateContactMessage,
  deleteContactMessage
} = require('../controllers/contactController');

const router = express.Router();

router.route('/').post(submitContactForm).get(getContactMessages);
router.route('/:id').put(updateContactMessage).delete(deleteContactMessage);

module.exports = router;
