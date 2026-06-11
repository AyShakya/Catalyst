const express = require("express");
const { query } = require("../config/db");
const {
  getAudienceDiscoveryContext,
} = require("../services/audience/audience-context");
const {
  generateAudienceFilterPlan,
} = require("../services/audience/ai-strategist");
const {
  generateAudiencePreview,
} = require("../services/audience/audience-preview");

const router = express.Router();

router.post("/discover", async (req, res) => {
  try {
    const { brand_id: brandId, goal } = req.body;

    if (!brandId) {
      return res
        .status(400)
        .json({ error: "brand_id is required in request body" });
    }

    if (!(await doesBrandExist(brandId))) {
      return res.status(404).json({ error: "brand_id was not found" });
    }

    const context = await getAudienceDiscoveryContext(brandId);
    const readinessError = getContextReadinessError(context);

    if (readinessError) {
      return res.status(409).json({
        error: readinessError,
        status: "not_ready",
      });
    }

    // 1. AI Strategist Pass 1: Audience Discovery
    const filterPlan = await generateAudienceFilterPlan(goal, context);

    // 2. Audience Preview: Execute and generate snapshot
    const audiencePreview = await generateAudiencePreview(
      brandId,
      filterPlan,
      context.dataset_summary
    );

    res.json({
      status: "success",
      data: {
        brand_id: brandId,
        goal: typeof goal === "string" ? goal.trim().slice(0, 1000) : goal,
        filter_plan: {
          logic: filterPlan.logic,
          filters: filterPlan.filters,
          segment_name: filterPlan.segment_name,
          reasoning: filterPlan.reasoning,
        },
        audience_preview: audiencePreview,
        ai: {
          model: filterPlan.model,
          validation_attempts: filterPlan.validation_attempts,
        },
        context_used: {
          dataset_summary_generated_at: context.dataset_summary.generated_at,
          metric_registry_count: context.metric_registry.length,
          metric_distribution_metric_count: Object.keys(
            context.metric_distributions
          ).length,
        },
      },
    });
  } catch (error) {
    console.error("Audience discovery error:", error);
    res.status(error.statusCode || 500).json({
      error: error.message,
      details: error.details,
      status: "failed",
    });
  }
});

function getContextReadinessError(context) {
  if (!context.dataset_summary) {
    return "dataset_summary is missing. Upload data and rebuild metrics first.";
  }

  if (!context.metric_registry || context.metric_registry.length === 0) {
    return "metric_registry is empty. Run database initialization or rebuild metrics first.";
  }

  if (
    !context.metric_distributions ||
    Object.keys(context.metric_distributions).length === 0
  ) {
    return "metric_distributions are missing. Rebuild metrics first.";
  }

  return null;
}

async function doesBrandExist(brandId) {
  const result = await query("SELECT 1 FROM brands WHERE id = $1", [brandId]);
  return result.rows.length > 0;
}

module.exports = router;
