const express = require("express");
const { login, adminLogin } = require("../controllers/admin-controller.js");
const { createCompany } = require("../controllers/auth-controller.js");
const router = express.Router();

router.route("/login").post(login);
router.route("/admin/login").post(adminLogin);
router.route("./createcompany/").post(createCompany);
router.route("./manager/login").post(managerAslogin);

module.exports = router;
