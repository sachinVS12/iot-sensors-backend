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
