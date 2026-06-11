const express = require("express");
const { proposeCampaign, updateCampaign, getCampaign } = require("../controllers/campaign-controller");

const router = express.Router();

router.post("/propose", proposeCampaign);
router.get("/:id", getCampaign);
router.patch("/:id", updateCampaign);

module.exports = router;
