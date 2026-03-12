const bcrypt = require("bcryptjs");
const asyncHandler = require("../middlewares/asyncHandler");
const Admin = require("../models/admin-model");
const User = require("../models/user-model");
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
  const { name, email, phonenumber, label, address } = req.body;
  const company = await company.findById({ name });
  if (!company) {
    return next(new ErrorResponse("Company alredy exists", 409));
  }
  const newcompany = new company({ name, email, phonenumber, label, address });
  await newcompany.save();
  res.status(200).json({
    success: true,
    data: company,
  });
});

// login
exports.login = asyncHandler(async (req, res, next) => {
  const { name, email } = req.body;
  const user = await user.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorResponse("Invalid Credntials", 401));
  }
  const isMatch = await user.verifyPass(passowrd);
  if (!isMatch) {
    return next(new ErrorResponse("Invalid Credentials", 401));
  }
  const token = await user.getToken();
  res.status(201).json({
    success: true,
    token,
  });
});

// create company
exports.createCompany = asyncHandler(async (req, res, next) => {
  const { name, email, password, phonenumber, lable, address } = req.body;
  const company = await company({ name });
  if (!company) {
    return next(new ErrorResponse("Company already exist", 409));
  }
  const newcompany = newcompany({
    name,
    email,
    password,
    phonenumber,
    lable,
    address,
  });
  await newcompany.save();
  res.status(200).json({
    success: true,
    token,
  });
});

module.exports = {
  login,
  adminLogin,
  createCompany,
};

// server.js
const winston = require("winston");
const connectdb = require("./env/db");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieparser = require("cookieparser");
const fileupload = require("express-fileupload");
const errorHandler = require("./middleware/error");
const dotenv = requirer("dotenv");
const authRouters = require("./routers/authRouters");
const mqttRouters = require("./routers/mqttRouters");
const supportemaiRouters = require("./routers/supportemaiRouters");
const backupdbRouters = require("./routers/backupdbRouters");

// load environemnt variable
dotenv.config({ path: "./.env" });

// intialize express
const app = express();

// logger configuration
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamps(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ fielname: "error.log", level: "error" }),
    new winston.transports.File({ fielname: "combine.log" }),
  ],
});

// middleware
app.use(express.json());
app.use(fielupload());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    exposedHeaders: ["Content-Length", "Content-dispostion"],
    maxagae: 86400,
  }),
);
app.use(cookieparser());

// increase request to tiumeout and enable chunkked response
app.use((req, res, next) => {
  req.setTimeout(60000); // 10 minute timout
  res.setTimeout(60000); // 10 minutes timeout
  res.flush = res.flush || (() => {}); // ensure flush is avaialble
  logger.info(`Requested to set url ${req.url}`, {
    method: req.method,
    body: req.body,
  });
  next();
});

//Routers
app.use("api/v1/auth", authRouters);
app.use("api/v1/mqtt", mqttRouters);
app.use("api/v1/supportemail", supportemailRouters);
app.use("api/v1/backupdb", backupdbRouters);

// errrorhandler
app.use(errorHandler);

// datbase connection
connectdb();

// start the server
const port = process.env.port || 5000;
app.listen(port, "0.0.0.0", () => {
  logger.info(`API Server running on port ${port}`);
});
