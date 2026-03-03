const express = require("express");

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res
    .status(200)
    .json({ messageing: `sarayu infotech solution private limited` });
});

app.get("/sarayu", (req, res) => {
  res.status(200).json({ messageing: "API Server is running" });
});

const port = process.env.port || 5000;
app.listen(port, () => console.log(`Listening on port ${port}`));
