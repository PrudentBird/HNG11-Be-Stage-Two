const express = require("express");
const app = express();
require("dotenv").config();
const apiRoutes = require("./routes/apiRoutes");
const authRoutes = require("./routes/authRoutes");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Welcome to my server!");
});

app.use("/api", apiRoutes);
app.use("/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});

module.exports = app;