const bcrypt = require("bcryptjs");
const asyncHandler = require("../middlewares/asyncHandler");
const Admin = require("../models/admin-model");
const User = require("../models/user-model");
const Manager = require("../models/manager-model");
const ErrorResponse = require("../utils/errorResponse"); // new utility

// Login
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse("Please provide email and password", 400));
  }

  // Find admin and include password field (which is select: false by default)
  const admin = await Admin.findOne({ email }).select("+password");

  if (!admin) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  const isMatch = await admin.verifyPass(password);

  if (!isMatch) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  const token = admin.getToken();

  res.status(200).json({
    success: true,
    token,
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
});

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

// create company
const createCompany = asyncHandler(async (req, res, next) => {
  const { name, email, phonenumber, address, label } = req.body;
  const company = await Company.findOne({ name });
  if (company) {
    return next(new ErrorResponse("Company already exists!", 409));
  }

  const newCompany = new Company({ name, email, phonenumber, address });
  await newCompany.save();
  res.status(201).json({
    success: true,
    data: newCompany,
  });
});

//get single company
const getSingleCompany = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const company = await Company.findById(companyId);
  if (!company) {
    return next(
      new ErrorResponse(`No company found with id ${companyId}`, 404),
    );
  }
  res.status(200).json({
    success: true,
    data: company,
  });
});

//delete company
const deleteCompany = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const company = await Company.findById(id);
  if (!company) {
    return next(new ErrorResponse(`No company found with id ${id}`, 404));
  }
  await company.deleteOne();
  res.status(200).json({
    success: true,
    data: [],
  });
});

module.exports = {
  login,
  adminLogin,
  createCompany,
  getSingleCompany,
  deleteCompany,
};
