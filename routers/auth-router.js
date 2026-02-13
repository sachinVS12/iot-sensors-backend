const express = require("express");
const {
  login,
  adminLogin,
  createCompany,
} = require("../controllers/auth-controller");
const router = express.Router();

router.route("/login").post(login);
router.route("/admin/login").post(adminLogin);
router.route("/companies").post(createCompany);

module.exports = router;
