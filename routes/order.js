const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middlewares/user");
const {
  createOrder,
  getOrder,
  getLoggedInOrders,
} = require("../controllers/orderController");

router.route("/order/create").post(isLoggedIn, createOrder);
router.route("/order/:id").get(isLoggedIn, getOrder);
router.route("/myorder").get(isLoggedIn, getLoggedInOrders);

module.exports = router;
