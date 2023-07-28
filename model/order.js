const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId, //mongoose.Schema.objectId
    ref: "User",
    required: true,
  },
  orderItems: [
    {
      course: {
        type: mongoose.Schema.Types.ObjectId, //mongoose.Schema.objectId
        ref: "Course",
        required: true,
      },
    },
  ],
  paymentInfo: {
    id: {
      type: String,
    },
  },
  taxAmount: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);
