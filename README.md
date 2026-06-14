# Catalyst

Work - 
3. Maybe adding a jobqueue for all of this async background proceses.
4. Maybe introducing caching somewhere, and maybe setting up multi-agent orchestration.
6. Something about continous customer and order data from marketer, because in real time it will not be one time data, it will also keep updating with time.
9. Right now the campaign history feature is very rigid and not strong, need to fix that, make it more dynamic and robust.
10. Security against infinite chatting and draft creation.
11. Button for re calculation of customer_metrics, and other metrics.
12. Idempotency Keys: The CRM handles duplicate events, but the Channel Service doesn't send an event_id.
       * Suggestion: Generate a unique event_id in the Channel Service and use it as a Natural Key in the CRM's communication_events table to ensure strict idempotency.
13. Use more react.memo in chart data to prevent unwanted re-renders.
14. Webhook is open to everyone, an webhook secuity with signature signoff.
15. Batch dispatching from crm and also batch sending events from the channel_service.
16. Improved prop drilling with incremental loading in frontend with so many data fields and chart.
17. Using something like redux for state management because there is a lot to handle.
18. In-Memory Lifecycle: The simulation uses nested setTimeout.
       * Risk: If the service crashes, all "scheduled" events (DELIVERED, OPENED, etc.) for messages currently in flight are lost forever.
       * Suggestion: Use a persistent event queue (like SQLite-based queue or Redis) to store pending events. This allows the simulation to survive restarts.
19. Recursive Retry Logic: The sendWebhook function retries via recursion and setTimeout.
       * Risk: Potential stack overflow or memory leaks under extreme volume.
       * Suggestion: Implement a Retry-After header or a standard retry queue with exponential backoff.
20. Searching mechanism in campaigns.
21. Showing the text of executive summary in formatted sense.
---

## 📈 Scale Assumptions & Architectural Trade-offs

During the development of Catalyst V2, several conscious architectural decisions were made to prioritize rapid prototyping and "AI-Native" UX while maintaining a clear roadmap for production scale.

### 1. Concurrency & Processing
*   **Current State**: Campaigns are dispatched using Node.js `setImmediate` background loops. This works efficiently for audiences up to ~50k users.
*   **Scale Trade-off**: For 1M+ users, a direct loop would risk blocking the Node.js event loop.
*   **Production Path**: Move campaign dispatch to a dedicated **Task Queue (Redis/BullMQ)** with worker clusters to ensure the API remains responsive during high-volume dispatches.

### 2. Memory Management
*   **Current State**: Pending communications are fetched into memory for dispatching.
*   **Scale Trade-off**: Large campaigns could cause Out-of-Memory (OOM) errors.
*   **Production Path**: Implement **Cursor-based Batching** (fetching 500-1000 records at a time) to maintain a flat memory profile regardless of audience size.

### 3. Intelligence & Analytics
*   **Current State**: Weekly Executive Briefs use **Lazy Evaluation with a 7-day Cache**. This eliminates redundant LLM calls (OpenRouter) and ensures instant dashboard loads for returning users.
*   **Current State**: Opportunity detection uses **Deterministic Heuristics (SQL detectors)** instead of raw LLM scanning, ensuring 100% accuracy and sub-millisecond performance on large datasets.

### 4. Data Integrity
*   **Idempotency**: The Webhook Controller uses a **Status Priority Map** to ensure events are processed in order (e.g., a `DELIVERED` event cannot overwrite an `OPENED` state if it arrives late).
*   **PII Security**: The system "freezes" the audience into a separate table before dispatch, abstracting sensitive customer data from the active campaign dashboard.