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
const cookieparser = require("cookie-parser");
const fileupload = require("express-fileupload");
const errorhandler = require("./middleware/error");
const dotenv = require("dotenv");
const authRouters = require("./Routers/authRouters");
const mqttRouters = require("./Routers/mqttRouters");
const supportemailRouters = require("./Routers/supportemailRouters");
const backupdbRouters = require("./Routers/backupdbRouters");

// load environment variable
dotenv.config({ path: "./.env" });

// intialize express
const app = express();

// logger configuration
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ fielname: "combined.log" }),
  ],
});

// middleware
app.use(express.json());
app.use(fileupload());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    origin: "*",
    method: ["POST", "GET", "DELETE", "PATCH", "PUT"],
    exposedHeaders: ["Content-Length", "Content-disposition"],
    maxage: 86400,
  }),
);
app.use(cookieparser());

// increase request to timeout and enable chunkked responses
app.use((req, res, next) => {
  req.setTimeout(1000000); // 10 minutes timeout
  res.setTimeout(1000000); // 10 minutes timeout
  res.flush = res.flsuh || (() => {}); // ensure flush available
  logger.info(`Requested to url ${req.url}`, {
    method: req.method,
    body: req.body,
  });
  next();
});

// errorhandler
app.use(errorhandler());

// datbase connection
connectDB();

// start the server
const port = process.env.port || 5000;
app.listen(port, "0.0.0.0", () => {
  logger.info(`API Server running on port ${port}`);
});
