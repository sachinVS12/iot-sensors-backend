const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
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
    label: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Company", companySchema);

// const Company = mongoose.model("Company", companySchema);

// module.exports = Company;
