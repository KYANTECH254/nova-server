require("dotenv").config();
const express = require("express");
const path = require("path");
// const mikrotikRoutes = require("./mikrotik/routes/mikrotikRoutes");

const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

// app.use("/api/mkt", mikrotikRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
