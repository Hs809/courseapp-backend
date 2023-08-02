const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"],
    maxlength: [40, "Name should be under 40 characters"],
  },
  email: {
    type: String,
    validate: [validator.isEmail, "Please enter email in correct format"],
    required: [true, "Please provide an email"],
    unique: [true, "Email is used try different email"],
  },
  password: {
    type: String,
    required: [true, "Please provide an password"],
    minlength: [6, "Password is too short, should be more that 6 character"],
    select: false,
  },
  role: {
    type: String,
    default: "user",
  },
  photo: {
    id: {
      type: String,
    },
    secure_url: {
      type: String,
    },
  },
  forgotPasswordToken: String,
  forgotPasswordExpiry: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  courseAccess: [
    {
      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    },
  ],
  courseCreated: [
    {
      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    },
  ],
});

// encrypt password before save - Hooks
// if the password is not modified then go ahead do your thing if its modified then encrypt the password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

// validate the password with passed on user password
userSchema.methods.isValidatedPassword = async function (userSendPassword) {
  return await bcrypt.compare(userSendPassword, this.password);
};

// create and return jwt token
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });
};

// generate forgot password token (string)
userSchema.methods.getForgotPasswordToken = function () {
  // generate a long and random string
  const forgotPasswordToken = crypto.randomBytes(20).toString("hex");
  // getting a hash make sure to get a hash on the backend
  this.forgotPasswordToken = crypto
    .createHash("sha256")
    .update(forgotPasswordToken)
    .digest("hex");
  // time of token
  console.log({ cryptoPassword: this.forgotPasswordToken });
  this.forgotPasswordExpiry = Date.now() + 20 * 60 * 1000;
  return forgotPasswordToken;
};

module.exports = mongoose.model("User", userSchema);
