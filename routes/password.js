const express = require('express');
const {
    getForgotPasswordView, 
    sendForgotPasswordLink,
    getResetPasswordView,
    resetThePasswordView
} = require('../controllers/passwordController');
const router = express.Router();

router.route("/forgot-password")
.get(getForgotPasswordView)
.post(sendForgotPasswordLink);

// /password/reset-password/:id/:token
router.route("/reset-password/:id/:token")
.get(resetThePasswordView)
.post(getResetPasswordView);
 
module.exports = router;
