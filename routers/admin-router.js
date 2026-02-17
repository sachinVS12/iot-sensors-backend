const express = require("express");
const { login, adminLogin } = require("../controllers/admin-controller.js");
const router = express.Router();

router.route("/login").post(login);
router.route("/admin/login").post(adminLogin);

module.exports = router;
