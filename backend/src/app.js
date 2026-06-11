const express = require("express");
const uploadRoutes = require("./routes/upload");
const metricsRoutes = require("./routes/metrics");

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/health", (req, res) => {
	res.json({ status: "ok" });
});

app.use("/api", uploadRoutes);
app.use("/api/metrics", metricsRoutes);

module.exports = app;
