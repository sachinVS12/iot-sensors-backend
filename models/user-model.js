const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// efine user Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: ture,
    },
    email: {
      type: String,
      required: true,
    },
    phonenumber: {
      type: String,
      required: ture,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "company",
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
    assignedigitalmetrs: {
      type: [
        {
          topics: String,
          metrtype: String,
          minvalue: Number,
          maxvalue: Number,
          tick: String,
          label: Number,
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

// pre -save middleware hash password before save database
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// method to verify jwt token signedup and loggedin
userSchema.method.getToken = function () {
  return jwt.sign(
    {
      id: this._id,
      name: this.name,
      email: this.email,
      phonenumber: this.phonenumber,
      role: this.role,
      assignedigitalmetrs: this.assignedigitalmetrs,
    },
    procee.env.JWT_SECRET,
    {
      expireIn: "3d",
    },
  );
};

// method enterpassword into existing password
userSchema.method.verifypass = async function (enteredPassword) {
  return await bcrypt.compare(this.password, enteredPassword);
};

// create model
const user = mongoose.model("user", userSchema);

// exports module
exports.module = user;
