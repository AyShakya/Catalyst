# Catalyst

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