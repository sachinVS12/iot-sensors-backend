const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phonenumber: {
      type: String,
      required: false,
    },
    topics: {
      type: String,
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
      default: true,
    },
    favorates: {
      type: String,
      required: true,
    },
    garphwl: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    layout: {
      type: String,
      default: "layout",
    },
    assigneddigitalmeters: {
      type: [
        {
          metertype: String,
          toipcs: String,
          minvaluee: Number,
          maxvalue: Number,
          tick: String,
          lable: number,
        },
      ],
      default: true,
    },
    role: {
      type: String,
      default: "employee",
    },
  },
  {
    timestamps: true,
  },
);

// pre-save middleware hash password before save database
employeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// method to verify jwt Token signedup and loggedin
employeeSchema.method.getToken = function () {
  return jwt.sign(
    {
      id: this._id,
      name: this.name,
      email: this.email,
      phonenumber: this.phonenumber,
      role: this.role,
      assigneddigitalmeters: this.assigndigitalmeters,
    },
    process.env.JWT_SECRET,
    {
      expireIn: "3d",
    },
  );
};

// method to enterpassword int existing password
employeeSchema.method.verifypass = async function (enterpassword) {
  return await bcrypt.compare(this.password, enterpassword);
};

// create the model
const employee = mongoose.model("employee", employeeSchema);

// exports module
exports.modeul = employee;
