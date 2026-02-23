const winston = require("winston");
const connectDB = require("./env/db");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fileupload = require("express-fileupload");
const errorHandler = require("./middlewares/asyncHandler");
const dotenv = require("dotenv");
const authRoute = require("./routers/auth-router");
const asyncHandler = require("./middlewares/asyncHandler");
const ErrorResponse = require("./utils/errorResponse");

// Load environment variables (silent)
dotenv.config({ path: "./.env", quiet: true });

// Initialize Express
const app = express();

// Winston Logger (FILE ONLY — no console transport)
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
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

// Routes
app.use("/api/v1/auth", authRoute);

// Error handling
app.use(errorHandler);

// Database connection
connectDB(); // should already console.log success inside db file

// Start server
const port = process.env.PORT || 5000;
app.listen(port, "0.0.0.0", () => {
  console.log(`API Server running on port ${port}`);
});
