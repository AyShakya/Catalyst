const express = require("express");
const uploadRoutes = require("./routes/upload");

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/health", (req, res) => {
	res.json({ status: "ok" });
});

app.use("/api", uploadRoutes);

module.exports = app;
