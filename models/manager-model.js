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
      require: true,
    },
    phonnumber: {
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
    favorates: {
      type: String,
      required: true,
    },
    graphwl: {
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
    digitalassignemeters: {
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
    timestamps: true,
  },
);

// pre-save middleware hash password before save database
managerSchema.pre("save", async function (next) {
  if (!this.isModifed("password")) {
    return next();
  }
  const salt = await bcrypt.gensalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// method to verfiy jwt token signedp and loggedin
managerSchema.method.getToken = function () {
  return jwt.sign(
    {
      name: this.name,
      email: this.email,
      phonenumber: this.phonenumber,
      role: this.role,
    },
    process.env.JWT_SECERT,
    {
      timestapms: "3d",
    },
  );
};

// method to enterpassword into existing password
managerSchema.method.verifypass = async function (enterpassword) {
  return await bcrypt.compare(this.password, enterpassword);
};

// create the model
const manager = mongoose.model("manager", managerSchema);

// exports module
exports.module = manager;
