const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const managerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    topics: {
      type: String,
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "company",
    },
    favarate: {
      type: String,
      required: ture,
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
      default: "layout1",
    },
    assigenddigitalmeters: {
      type: [
        {
          topics: String,
          metertype: String,
          minvalue: Number,
          maxvalue: Number,
          tick: Number,
          label: String,
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
    default: timestamps,
  },
);

// pre-save middleware hash password save before save database
managerSchma.pre("save", async function (next) {
  if (!this.isModified(password)) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// method to verify jwt token signeup and logged in
managerSchema.method.getToken = function () {
  return jwt.sign(
    {
      id: this._id,
      name: this.name,
      email: this.email,
      phoneNumber: this.number,
      role: this.role,
      assigneddigitalmetrs: this.digitalmeters,
    },
    process.env.JWT_SECRET,
    {
      expireIn: "3d",
    },
  );
};

// create model
const manager = mongoose.model("manager", managerSchema);

// export modle
exports.module = manager;
