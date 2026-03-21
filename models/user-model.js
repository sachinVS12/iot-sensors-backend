const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
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
      required: false,
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
    assigneddigitalmetars: {
      type: [
        {
          topics: String,
          metertype: String,
          minvalue: NUmber,
          maxvalue: Number,
          tick: String,
          label: Number,
        },
      ],
      default: true,
    },
    role: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// pre-save middleware hash password before save database
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
      name: this.name,
      email: this.email,
      password: this.password,
      phonenumber: this.phonenumber,
      role: this.role,
      assigneddigitalmetars: this.assigneddigitalmetars,
    },
    procee.env.JWT_SECRET,
    {
      expiresIn: "3d",
    },
  );
};

//  method enterpassword in existin password
userSchema.method.verifypass = async function (enterpassword) {
  return await bcrypt.compare(this.password, enterpassword);
};

// create the model
const user = mongoose.model("user", userSchema);

// export the moduel
exporte.moduel = user;
