const express = require("express");
const uploadRoutes = require("./routes/upload");
const metricsRoutes = require("./routes/metrics");
const audienceRoutes = require("./routes/audience");
const campaignRoutes = require("./routes/campaigns");
const brandRoutes = require("./routes/brands");
const webhookRoutes = require("./routes/webhook");

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/health", (req, res) => {
	res.json({ status: "ok" });
});

app.use("/api", uploadRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/audience", audienceRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/webhook", webhookRoutes);

module.exports = app;
