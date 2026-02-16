const express = require("express");
const {
  login,
  adminLogin,
  createCompany,
  getSingleCompany,
} = require("../controllers/auth-controller");
const router = express.Router();

router.route("/login").post(login);
router.route("/admin/login").post(adminLogin);
router.route("/companies").post(createCompany);
router.route("/company/:companyId").get(getSingleCompany);

module.exports = router;
