const { query } = require("../../config/db");
const { calculateCustomerMetrics } = require("./customer-metrics");
const { generateDatasetSummary } = require("./dataset-summary");
const { generateMetricDistributions } = require("./metric-distributions");
const { seedMetricRegistry } = require("./metric-registry");
const { seedSegmentRegistry } = require("./segment-registry");
const opportunityFeedService = require("../intelligence/opportunity-feed");
const campaignIntelligenceService = require("../intelligence/campaign-intelligence");

class QueueManager {
  constructor() {
    this.isProcessing = false;
  }

  /**
   * Queues a metrics regeneration job for a brand.
   * @param {string} brandId
   */
  async queueJob(brandId) {
    const res = await query(
      `INSERT INTO metrics_generation_jobs (brand_id, status)
       VALUES ($1, 'PENDING')
       RETURNING id, status, created_at`,
      [brandId]
    );
    
    // Trigger the processing loop asynchronously
    this.triggerWorker();
    
    return res.rows[0];
  }

  /**
   * Triggers the background worker.
   */
  triggerWorker() {
    if (this.isProcessing) return;
    
    setImmediate(async () => {
      await this.processQueue();
    });
  }

  /**
   * Processes pending metrics calculation jobs from the queue.
   */
  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (true) {
        // Claim a pending job using transactional locks (FOR UPDATE SKIP LOCKED) to prevent double worker processing
        const claimRes = await query(
          `UPDATE metrics_generation_jobs
           SET status = 'RUNNING', started_at = NOW()
           WHERE id = (
             SELECT id FROM metrics_generation_jobs
             WHERE status = 'PENDING'
             ORDER BY created_at ASC
             FOR UPDATE SKIP LOCKED
             LIMIT 1
           )
           RETURNING id, brand_id`
        );

        if (claimRes.rows.length === 0) {
          // No pending jobs
          break;
        }

        const job = claimRes.rows[0];
        const jobId = job.id;
        const brandId = job.brand_id;

        console.log(`[Queue Worker] Processing job ${jobId} for brand ${brandId}...`);

        try {
          // Set initial progress: 10%
          await query(
            `UPDATE metrics_generation_jobs
             SET records_processed = 10
             WHERE id = $1`,
            [jobId]
          );

          // 1. Calculate customer metrics
          const metricsResult = await calculateCustomerMetrics(brandId);
          await query(
            `UPDATE metrics_generation_jobs
             SET records_processed = 30
             WHERE id = $1`,
            [jobId]
          );

          // 2. Generate dataset summary
          const datasetResult = await generateDatasetSummary(brandId);
          await query(
            `UPDATE metrics_generation_jobs
             SET records_processed = 50
             WHERE id = $1`,
            [jobId]
          );

          // 3. Generate metric distributions
          const distResult = await generateMetricDistributions(brandId);
          await query(
            `UPDATE metrics_generation_jobs
             SET records_processed = 70
             WHERE id = $1`,
            [jobId]
          );

          // 4. Seed registries for audience analysis
          const registryResult = await seedMetricRegistry();
          const segmentResult = await seedSegmentRegistry();
          await query(
            `UPDATE metrics_generation_jobs
             SET records_processed = 90
             WHERE id = $1`,
            [jobId]
          );

          // 5. Refresh Opportunities & Intelligence
          try {
            await opportunityFeedService.refreshOpportunities(brandId);
            await campaignIntelligenceService.refreshIntelligence(brandId);
          } catch (biErr) {
            console.error(`[Queue Worker] BI layer warning for brand ${brandId}:`, biErr);
          }

          const recordsProcessed =
            (metricsResult.metrics_calculated || 0) +
            (distResult.distributions_generated || 0);

          // Update job to completed
          await query(
            `UPDATE metrics_generation_jobs
             SET status = 'COMPLETED', completed_at = NOW(), records_processed = $1
             WHERE id = $2`,
            [recordsProcessed, jobId]
          );

          console.log(`[Queue Worker] Job ${jobId} completed successfully.`);
        } catch (jobError) {
          console.error(`[Queue Worker] Job ${jobId} failed:`, jobError);
          
          await query(
            `UPDATE metrics_generation_jobs
             SET status = 'FAILED', completed_at = NOW(), error_message = $1
             WHERE id = $2`,
            [jobError.message, jobId]
          );
        }
      }
    } catch (err) {
      console.error("[Queue Worker] Queue manager loop encountered a crash:", err);
    } finally {
      this.isProcessing = false;
    }
  }
}

module.exports = new QueueManager();
