require("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
const mikrotikRoutes = require("./mikrotik/routes/mikrotikRoutes");
const mpesaRoutes = require("./mpesa/routes/mpesaRoutes");
const { SocketInstance } = require("./socket/controllers/socketController");

const app = express();
const server = http.createServer(app); 
const io = SocketInstance(server); 

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/mkt", mikrotikRoutes);
app.use("/mpesa", mpesaRoutes);

// Serve the homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
