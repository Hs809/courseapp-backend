const BigPromise = require("../middlewares/bigPromise");
const Order = require("../model/order");
const Product = require("../model/product");
const CustomError = require("../utils/customerError");

exports.createOrder = BigPromise(async (req, res, next) => {
  const { orderItems, paymentInfo, taxAmount, shippingAmount, totalAmount } =
    req.body;
  const order = await Order.create({
    orderItems,
    paymentInfo,
    taxAmount,
    shippingAmount,
    totalAmount,
    user: req.user._id,
  });
  res.status(200).json({
    success: true,
    order,
  });
});

exports.getOrder = BigPromise(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );
  if (!order) {
    return next(new CustomError("please check order id", 401));
  }
  res.status(200).json({
    success: true,
    order,
  });
});
exports.getLoggedInOrders = BigPromise(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id });
  if (!order) {
    return next(new CustomError("No order is created for this user", 401));
  }
  res.status(200).json({
    success: true,
    orders,
  });
});
