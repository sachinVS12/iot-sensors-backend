const bcrypt = require("bcryptjs");
const asyncHandler = require("../middlewares/asyncHandler");
const Admin = require("../models/admin-model");
const User = require("../models/user-model");
const Manager = require("../models/manager-model");
const Company = require("../models/company-model");
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

const signin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await user.findOne({ email }).slected("+password");
  if (!user) {
    return next(new ErrorResponse("Invalid Credentials", 401));
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

const createSupervisor = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const { name, email, password, phonenumber, mqttTopic } = req.body;
  console.log(password);
  const findSupervisor = await Supervisor.findOne({ email });
  if (findSupervisor) {
    return next(new ErrorResponse("Email already exists!", 500));
  }
  const supervisor = await Supervisor.create({
    name,
    email,
    password,
    phonenumber,
    mqttTopic,
    company: companyId,
  });
  res.status(201).json({
    success: true,
    data: supervisor,
  });
});

const createSupervisorAndAssignManager = asyncHandler(
  async (req, res, next) => {
    const { companyId, managerId } = req.params;
    const { name, email, password, phonenumber } = req.body;
    const findSupervisor = await Supervisor.findOne({ email });
    if (findSupervisor) {
      return next(new ErrorResponse("Email already exist!", 500));
    }
    const supervisor = await Supervisor.create({
      name,
      email,
      password,
      phonenumber,
      company: companyId,
      manager: managerId,
    });
    res.status(201).json({
      success: true,
      data: supervisor,
    });
  },
);

const createManager = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const { name, email, password, phonenumber } = req.body;
  // const findManager = await Manager.findOne({ company: companyId });
  // if (findManager) {
  //   return next(new ErrorResponse("A manager already exists!", 409));
  // }
  const findMail = await Manager.findOne({ email });
  if (findMail) {
    return next(new ErrorResponse("Email already exists!", 400));
  }
  // const mailCred = await MailCred.findOne({ active: true });
  // await sendMail(
  //   mailCred.email,
  //   mailCred.appPassword,
  //   email,
  //   "Manager Login Credentails",
  //   `Email : ${email}, Password : ${password}`
  // );
  const manager = await Manager.create({
    name,
    email,
    password,
    phonenumber,
    company: companyId,
  });
  res.status(201).json({
    success: true,
    data: manager,
  });
});

//get all manager of a company
const getAllManager = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const managers = await Manager.find({ company: companyId }).populate(
    "company",
  );
  res.status(200).json({
    success: true,
    data: managers,
  });
});

//create room
const createRoom = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const { name } = req.body;
  let room = await Room.create({ name, company: companyId });
  room = await Room.findById(room._id).populate("company");
  res.status(201).json({ success: true, data: room });
});

// get all Rooms
const getRooms = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const rooms = await Room.find({ company: companyId }).populate("company");
  if (!rooms.length) {
    return res
      .status(404)
      .json({ success: false, message: "No rooms found for this company" });
  }
  res.status(200).json({ success: true, count: rooms.length, data: rooms });
});

const getAllSupervisorOfSameCompany = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;

  const supervisors = await Supervisor.find({ company: companyId })
    .populate("company")
    .populate("manager")
    .populate("employees");

  res.status(200).json({
    success: true,
    count: supervisors.length,
    data: supervisors,
  });
});

//Login as employee
const loginAsEmployee = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await Employee.findOne({ email })
    .select("+password")
    .populate("company")
    .populate("supervisor");
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
    user,
    token,
  });
});

//create a employee
const createEmployee = asyncHandler(async (req, res, next) => {
  const { companyId, supervisorId } = req.params;
  const {
    name,
    email,
    password,
    phonenumber,
    mqttTopic,
    headerOne,
    headerTwo,
  } = req.body;
  const employee = await Employee.create({
    name,
    email,
    password,
    phonenumber,
    mqttTopic,
    headerOne,
    headerTwo,
    company: companyId,
    supervisor: supervisorId,
  });
  res.status(201).json({
    success: true,
    data: employee,
  });
});

module.exports = {
  login,
  adminLogin,
  createCompany,
  getSingleCompany,
  deleteCompany,
  createSupervisor,
  createSupervisorAndAssignManager,
};
