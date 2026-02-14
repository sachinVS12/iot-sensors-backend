const winston = require("winston");
const connectDB = require("./env/db");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fileupload = require("express-fileupload");
const errorHandler = require("./middlewares/asyncHandler");
const dotenv = require("dotenv");
const authRoute = require("./routers/auth-router");

// Load environment variables
dotenv.config({ path: "./.env" });

// Initialize Express
const app = express();

// Logger configuration
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
    new winston.transports.Console(), // added for development
  ],
});

// Middleware
app.use(express.json());
app.use(fileupload());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    exposedHeaders: ["Content-Length", "Content-Disposition"],
    maxAge: 86400,
  }),
);
app.use(cookieParser());

app.use((req, res, next) => {
  res.setTimeout(600000); // 10-minute response timeout
  logger.info(`Request: ${req.method} ${req.url}`, {
    body: req.body,
  });
  next();
});

// Routes
app.use("/api/v1/auth", authRoute);

// Error handling
app.use(errorHandler);

// Database connection
connectDB();

// Start server
const port = process.env.PORT || 5000;
app.listen(port, "0.0.0.0", () => {
  logger.info(`API Server running on port ${port}`);
});
