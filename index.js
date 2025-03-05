require("dotenv").config();
const express = require("express");
const mikrotikRoutes = require("./mikrotik/routes/mikrotikRoutes");

const app = express();
app.use(express.json());

app.use("/api/mkt", mikrotikRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
});
