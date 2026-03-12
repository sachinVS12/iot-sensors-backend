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
  },
  {
    expirein: "3d",
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
