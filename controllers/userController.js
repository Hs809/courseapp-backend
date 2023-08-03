const User = require("../model/user");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customerError");
const cookieToken = require("../utils/cookieToken");
const mailHelper = require("../utils/emailHelper");
const cloudinary = require("cloudinary").v2;
const crypto = require("crypto");

exports.signup = BigPromise(async (req, res, next) => {
  const { name, email, password } = req.body;
  if (!req.files) {
    return next(new CustomError("User photo is required", 400));
  }

  if (!email || !name || !password) {
    return next(new CustomError("Name, Email and password are required", 400));
  }
  let file = req.files.photo;
  let result = await cloudinary.uploader.upload(file.tempFilePath, {
    folder: "users",
    width: 150,
    crop: "scale",
  });
  const user = await User.create({
    name,
    email,
    password,
    photo: {
      id: result.public_id,
      secure_url: result.secure_url,
    },
  });

  user.password = undefined;
  cookieToken(user, res);
});

exports.login = BigPromise(async (req, res, next) => {
  const { email, password } = req.body;
  // check for presence of email and password
  if (!email || !password) {
    return next(new CustomError("Please provide email and password", 400));
  }
  // get user from DB
  const user = await User.findOne({ email }).select("+password");
  // user not found in DM
  if (!user) {
    return next(new CustomError("Email or password doesn't exist ", 400));
  }
  // matching the password
  const isPasswordCorrect = await user.isValidatedPassword(password);
  // password doesn't match
  if (!isPasswordCorrect) {
    return next(new CustomError("Email or password doesn't exist ", 400));
  }
  // if all goes good and we send the token
  cookieToken(user, res);
});
exports.logout = BigPromise(async (req, res, next) => {
  res.cookie("token", "", {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "Logout successfully",
  });
});
exports.forgotPassword = BigPromise(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new CustomError("Email not found as registered", 400));
  }

  const forgotToken = user.getForgotPasswordToken();

  await user.save({
    validateBeforeSave: false,
  });

  const myUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/password/reset/${forgotToken} `;

  const message = `Click on the URL to reset your password \n \n ${myUrl}`;

  try {
    await mailHelper({
      email,
      subject: "Password  Reset for MyCourse.com",
      message,
    });
    res.status(200).json({
      success: true,
      message: "Email send successfully",
    });
  } catch (error) {
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save({
      validateBeforeSave: false,
    });
    return next(new CustomError(error.message, 500));
  }
});
exports.passwordReset = BigPromise(async (req, res, next) => {
  const token = req.params.token;
  const encryptToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    encryptToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });
  if (!user) {
    return next(new CustomError("Token is invalid or expired", 401));
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new CustomError("Password and confirm Password do not match", 400)
    );
  }
  user.password = req.body.password;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;
  await user.save();
  cookieToken(user, res);
});
exports.getLoggedInUserDetail = BigPromise(async (req, res, next) => {
  // find the user from req.user and send the client
  const user = await User.findById(req.user.id).select("-password");
  res.status(200).json({
    success: true,
    data: user,
  });
});
exports.changePassword = BigPromise(async (req, res, next) => {
  const userId = req.user.id;
  const user = await User.findById(userId).select("+password");

  const { oldPassword, newPassword } = req.body;

  const isCorrectOldPassword = user.isValidatedPassword(oldPassword);
  if (!isCorrectOldPassword) {
    return next(new CustomError("old password is incorrect", 400));
  }

  user.password = newPassword;
  await user.save();
  cookieToken(user, res);
});
exports.updateUserDetails = BigPromise(async (req, res, next) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return next(new CustomError("Please provide name and email to update"));
  }
  const newdata = {
    name,
    email,
  };

  if (req.files) {
    const user = await User.findById(req.user.id);
    const imageId = user.photo.id;
    // delete the old photo
    const resp = await cloudinary.uploader.destroy(imageId);
    // upload the new photo
    let result = await cloudinary.uploader.upload(
      req.files.photo.tempFilePath,
      {
        folder: "users",
        width: 150,
        crop: "scale",
      }
    );
    newdata.photo = {
      id: result.public_id,
      secure_url: result.secure_url,
    };
  }

  const user = await User.findByIdAndUpdate(req.user.id, newdata, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    user,
  });
});
