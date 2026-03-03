const express = require("express");

// create an express server
const app = express();

// parse incomming requetse to JSON payload
app.use(express.json());

// parse incomming request with url-encoded payloads
app.use(express.urlencoded({ extended: true }));

// route
app.get("/", (req, res) => {
  res
    .status(200)
    .json({ messageing: `sarayu infotech solution private limited` });
});

// port
app.get("/sarayu", (req, res) => {
  res.status(200).json({ messageing: "API Server is running" });
});

// listen for connection
const port = process.env.port || 5000;
app.listen(port, () => console.log(`Listening on port ${port}`));
