const express = require("express");
const {
  handleMessage,
  getMessages,
  deleteMessage,
  sendMailtoCustomer,
  softDeleteMessage,
  getAllSoftDeletedMessage,
  restoreSoftDeleteMessage,
  addMailCredentials,
  getMailCredentials,
  getAllMails,
  deleteMailCredential,
  setActiveMailCred,
  createMailCredAndSetActive,
} = require("../controllers/supportmail-controller");
const router = express.Router();

// Attach the Socket.IO instance to the request object
router.use((req, res, next) => {
  req.io = req.app.get("socketio");
  next();
});
