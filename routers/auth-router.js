const express = require("express");
const { login, adminLogin } = require("../controllers/auth-controller");
const router = express.Router();

router.route("/login").post(login);
router.route("/admin/login").post(adminLogin);
router.route("/companies").post(createCompany);
router.route("/company/:companyId").get(getSingleCompany);
router.route("/companies/:id").delete(deleteCompany);

module.exports = router;
