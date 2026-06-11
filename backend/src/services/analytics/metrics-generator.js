const { query } = require("../../config/db");
const { calculateCustomerMetrics } = require("./customer-metrics");
const { generateDatasetSummary } = require("./dataset-summary");
const { generateMetricDistributions } = require("./metric-distributions");
const { seedSegmentRegistry } = require("./segment-registry");

async function regenerateMetrics(brandId) {
  let jobId;

  try {
    // Create job record
    const jobRes = await query(
      `INSERT INTO metrics_generation_jobs 
       (brand_id, status, started_at)
       VALUES ($1, 'RUNNING', NOW())
       RETURNING id`,
      [brandId]
    );
    jobId = jobRes.rows[0].id;

    // Step 1: Calculate customer metrics
    const metricsResult = await calculateCustomerMetrics(brandId);

    // Step 2: Generate dataset summary
    const datasetResult = await generateDatasetSummary(brandId);

    // Step 3: Generate metric distributions
    const distResult = await generateMetricDistributions(brandId);

    // Step 4: Seed segment registry (only once)
    const segmentResult = await seedSegmentRegistry();

    const recordsProcessed =
      metricsResult.metrics_calculated +
      (distResult.distributions_generated || 0);

    // Update job as completed
    await query(
      `UPDATE metrics_generation_jobs
       SET status = 'COMPLETED', 
           completed_at = NOW(),
           records_processed = $1
       WHERE id = $2`,
      [recordsProcessed, jobId]
    );

    return {
      job_id: jobId,
      status: "success",
      customer_metrics_calculated: metricsResult.metrics_calculated,
      dataset_summary: datasetResult,
      distributions_generated: distResult.distributions_generated,
      segments_seeded: segmentResult.segments_seeded,
      total_records_processed: recordsProcessed,
    };
  } catch (error) {
    if (jobId) {
      await query(
        `UPDATE metrics_generation_jobs
         SET status = 'FAILED',
             completed_at = NOW(),
             error_message = $1
         WHERE id = $2`,
        [error.message, jobId]
      );
    }

    throw error;
  }
}

async function getMetricsJobHistory(brandId, limit = 10) {
  const result = await query(
    `SELECT * FROM metrics_generation_jobs 
     WHERE brand_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [brandId, limit]
  );

  return result.rows;
}

module.exports = { regenerateMetrics, getMetricsJobHistory };
