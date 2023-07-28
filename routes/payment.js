const express = require("express");
const router = express.Router();
const { isLoggedIn  } = require("../middlewares/user");
const {sendStripeKey, captureStripePayment, sendRazorpayKey, captureRazorpayPayment} = require('../controllers/paymentController')

router.route("/stripekey").get(isLoggedIn, sendStripeKey);
router.route("/razorpaykey").get(isLoggedIn, sendRazorpayKey);


router.route("/stripepayment").get(isLoggedIn, captureStripePayment);
router.route("/razorpaypayment").get(isLoggedIn, captureRazorpayPayment);


module.exports = router;
