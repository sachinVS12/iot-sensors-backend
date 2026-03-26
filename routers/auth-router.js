const express = require("express");
const {
  login,
  adminLogin,
  createCompany,
  getSingleCompany,
  deleteCompany,
  createSupervisor,
} = require("../controllers/auth-controller");
const router = express.Router();

router.route("/login").post(login);
router.route("/admin/login").post(adminLogin);
router.route("/companies").post(createCompany);
router.route("/company/:companyId").get(getSingleCompany);
router.route("/companies/:id").delete(deleteCompany);
router.route("/createSupervisor").post(createSupervisor);
module.exports = router;

// server.js
const winston = require("winston");
const connectDB = require("./env/db");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const errorHandler = require("./middleware/error");
const cookieParser = require("cookie-parser");
const fielupload = require("express-fileupload");
const dotenv = require("dotenv");
const authRoute = require("./Routers/authRoute");
const mqttRoute = require("./Routers/mqttRouters");
const supportemailRoute = require("./Routers/supportemailRouter");
const backupdbRoute = require("./Routers/backupdbRoute");

// load environment variable
dotenv.config({ path: "./.env" });

// express intialize
const app = express();

// logger configuration
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: error.log, level: "error" }),
    new winston.transports.File({ filename: "combine.log" }),
  ],
});
