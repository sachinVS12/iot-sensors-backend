const bcrypt = require("bcryptjs");
const asyncHandler = require("../middlewares/asyncHandler");
const Admin = require("../models/admin-model");
const User = require("../models/user-model");
const ErrorResponse = require("../utils/errorResponse"); // new utility

// admin
const adminLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await Admin.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorResponse("Invalid Credentials", 401));
  }
  const isMatch = await user.verifyPass(password);
  if (!isMatch) {
    return next(new ErrorResponse("Invalid Credentials", 401));
  }
  const token = await user.getToken();
  res.status(200).json({
    success: true,
    data: user,
    token,
  });
});

module.exports = {
  login,
  adminLogin,
};
