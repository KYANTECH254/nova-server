require('dotenv').config();
const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const reqRoutes = require("./routes/routes");
const mikrotikRoutes = require("./mikrotik/routes/mikrotikRoutes");
const checkAndExpireUsers = require("./mikrotik/cronjobs/cronjob");
const mpesaRoutes = require("./mpesa/routes/mpesaRoutes");
const mailRoutes = require("./mailer/mailerRoutes")
const { SocketInstance } = require("./socket/controllers/socketController");

const app = express();
const server = http.createServer(app);  

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/req", reqRoutes);
app.use("/mkt", mikrotikRoutes);
app.use("/mpesa", mpesaRoutes);
app.use("/mail", mailRoutes);

const io = SocketInstance(server);

// Serve the homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

const PORT = process.env.PORT || 3013;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
