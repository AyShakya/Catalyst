# 🚀 Catalyst - AI-Native Marketing Strategist & CRM Platform

> Catalyst is a premium, enterprise-grade AI-native Customer Relationship Manager (CRM) and Campaign Optimization platform that combines a high-performance database-driven analytics pipeline with an autonomous agentic chat layer to turn raw customer transactions into high-converting, personalized omnichannel campaigns.

---

## 📌 Table of Contents

1. [Pipeline Architecture & System Design (Flowchart)](#2-pipeline-architecture--system-design-flowchart)
2. [How It Works (Sequence Diagram)](#3-how-it-works-sequence-diagram)
3. [Split-Phase Pipelines / Core System Flow](#4-split-phase-pipelines--core-system-flow)
   - [Pipeline 1: CSV Ingestion & Metrics Regeneration](#pipeline-1-csv-ingestion--database-backed-metrics-regeneration)
   - [Pipeline 2: AI Strategist & Segmentation Compiler](#pipeline-2-ai-strategist--segmentation-compiler)
   - [System-Wide Graceful Fallbacks](#system-wide-graceful-fallbacks)
4. [Monorepo Architecture](#5-monorepo-architecture)
5. [Key Features & Advanced Safeguards](#6-key-features--advanced-safeguards)
6. [Engineering Trade-offs](#7-engineering-trade-offs)
7. [Tech Stack & Technology Selection](#8-tech-stack--technology-selection)
8. [Project Structure (ASCII Directory Map)](#9-project-structure-ascii-directory-map)
9. [Prerequisites & Environment Variables](#10-prerequisites--environment-variables)
10. [Running Locally](#11-running-locally)
    - [Bare-Metal Execution](#bare-metal-execution)
    - [Docker Compose Alternative](#docker-compose-alternative)
    - [Verifying the Installation](#verifying-the-installation)
11. [System Taxonomy / Internal Configuration Matrices](#12-system-taxonomy--internal-configuration-matrices)
12. [Comprehensive API Routes Table](#13-comprehensive-api-routes-table)

---

## 2. Pipeline Architecture & System Design (Flowchart)

Catalyst separates data ingestion, asynchronous batch computations, and conversational generative AI orchestration to ensure sub-second UI responsiveness, data integrity, and strict safety boundaries.

```mermaid
graph TD
    %% Clients
    UI[React 19 Vite Web App] <-->|HTTP / SSE Stream| API[Express 5 API Gateway]

    %% Ingestion
    UI -->|Base64 CSV Upload| API
    API -->|csv-parse Buffer| IngestEngine[Ingestion Engine: Customer & Order Services]
    IngestEngine -->|Batch Inserts: 1000 records/chunk| PG_Raw[(PostgreSQL base tables)]

    %% Metrics Queue
    API -->|Queue Job| QueueMgr[Queue Manager]
    QueueMgr -->|INSERT PENDING| JobsTable[(PostgreSQL metrics_generation_jobs)]
    QueueWorker[Background Queue Worker] <-->|Claim Job: FOR UPDATE SKIP LOCKED| JobsTable
    QueueWorker -->|Run CTE Metrics recalculation| CTEMetrics[PostgreSQL CTE Metrics Engine]
    CTEMetrics -->|Recalculate CLV, Loyalty, Churn| PG_Metrics[(customer_metrics & dataset_summary)]

    %% AI Strategist
    UI <-->|Continuous Chat/SSE| StrategistController[Strategist Controller]
    StrategistController <-->|History & Session Context| strategSessionTable[(strategist_sessions & messages)]
    StrategistController <-->|Retrieve Dataset Context| PG_Metrics
    StrategistController -->|Generate Draft Proposal| OpenRouter[OpenRouter AI service: GPT-4o-mini]
    OpenRouter -->|Returns Filter Plan JSON| FilterVal[Filter Plan Validator]
    FilterVal -->|Validate fields/operators| Registry[(metric_registry & segment_registry)]
    FilterVal -->|Validated Filters / Predefined Segments| QueryBuilder[Audience SQL Query Builder]
    QueryBuilder -->|Audience Size Preview & Global summary| ForecastingEngine[Forecasting Engine]
    ForecastingEngine -->|Expected conversion & revenue metrics| StrategistController
    StrategistController -->|Save Campaign Draft| DraftsTable[(campaign_drafts versioning)]

    %% Execution & Dispatch
    UI -->|Approve & Execute Campaign| API
    API -->|Lock Session & Create Campaign| CampaignTable[(campaigns & communications)]
    API -->|Compile parameterized SQL| QueryBuilder
    QueryBuilder -->|Freeze targeting snapshot| AudienceTable[(campaign_audience)]
    API -->|Trigger Asynchronous Dispatcher| Dispatcher[Dispatcher Service]
    Dispatcher -->|Fetch PENDING comms| CampaignTable
    Dispatcher -->|Render templates & Batch dispatch: 100 msgs| ChannelService[External Channel Service]

    %% Telemetry Loop
    ChannelService -->|Simulate delivery logs| SQLite[(SQLite channel_service.db)]
    ChannelService -->|Lifecycle: Sent -> Delivered -> Opened -> Clicked -> Purchased| SQLite
    ChannelService -->|Flush webhook event batch| WebhookHandler[Express Webhook Controller]
    WebhookHandler -->|Idempotency check & statusPriority update| CampaignTable
    WebhookHandler -->|Insert event trail| EventLogs[(communication_events)]
    WebhookHandler -->|Trigger Campaign Refresh| AnalyticsRefresher[Campaign Analytics Refresher]
    AnalyticsRefresher -->|Update CTR, delivery, revenue| CampaignMetrics[(campaign_metrics)]
    CampaignMetrics <-->|Real-Time Analytics Dashboard| UI
```

---

## 3. How It Works (Sequence Diagram)

The following sequence diagram traces the lifecycle of customer transaction analysis, interactive AI strategist campaigns creation, target audience compiling, and event-driven simulation loop:

```mermaid
sequenceDiagram
    autonumber
    actor Marketer as Marketer (UI)
    participant API as API (Express)
    participant DB as PostgreSQL
    participant Queue as QueueManager / Worker
    participant AI as OpenRouter (LLM)
    participant Disp as Dispatcher Service
    participant Channel as Channel Service (SQLite)

    %% Data Ingestion Phase
    Marketer->>API: 1. POST /api/upload (Base64 CSVs)
    API->>API: Parse CSV buffer & chunk records (1000/batch)
    API->>DB: 2. Insert customers & orders (Transactional BEGIN/COMMIT)
    API->>DB: 3. Queue metrics rebuild job (status='PENDING')
    API-->>Marketer: 200 OK (Job status: PENDING)
    
    %% Background Metrics Calculation
    Queue->>DB: 4. Poll & Claim job (FOR UPDATE SKIP LOCKED)
    DB-->>Queue: Claimed job (status='RUNNING')
    Queue->>DB: 5. Execute CTE metrics calculation (CLV, Loyalty, Churn, Summary)
    DB-->>Queue: Calculation completed
    Queue->>DB: 6. Update job status to 'COMPLETED'
    
    %% AI Strategist Conversation Loop
    Marketer->>API: 7. POST /api/intelligence/.../chat (Goal: "VIP churn alert")
    API->>DB: 8. Retrieve message history & brand metrics context
    DB-->>API: Context retrieved
    API->>AI: 9. Request strategic draft campaign proposal
    AI-->>API: Returns Filter Plan JSON (filters, reasoning, channel, template)
    API->>API: 10. Validate filter plan against metric & segment registries
    API->>DB: 11. Run query builder & compile parameterized SQL to get audience size
    DB-->>API: Audience preview details (count, avg order value, etc.)
    API->>API: 12. Calculate conversion & revenue forecasts
    API->>DB: 13. Save new campaign draft version in campaign_drafts
    API-->>Marketer: 200 OK (Stream or return draft campaign, reasoning, and forecast)

    %% Campaign Launch & Execution
    Marketer->>API: 14. POST /api/intelligence/.../launch (Approve session)
    API->>DB: 15. Lock strategist session (status='LAUNCHED') & Create Campaign (status='DRAFT')
    DB-->>API: Campaign created
    API->>API: 16. Trigger Execute Campaign
    API->>DB: 17. Run compiled audience query & freeze customer IDs in campaign_audience
    API->>DB: 18. Generate PENDING communications tasks
    API-->>Marketer: 200 OK (Campaign status: RUNNING)

    %% Dispatch & Telemetry Simulation
    API->>Disp: 19. Trigger asynchronous dispatch (dispatchCampaign)
    Disp->>DB: 20. Retrieve campaign details & PENDING communications
    DB-->>Disp: Comm records & customer contact details
    Disp->>Disp: Render message templates & interpolate {{name}}
    Disp->>Channel: 21. POST /messages/send-batch (100 messages/chunk)
    Channel->>Channel: Record messages in SQLite
    Channel-->>Disp: 202 Accepted (Batch processing)
    Disp->>DB: 22. Update status of communications to 'SENT' & record event audit
    
    %% Channel Simulation Event Webhooks
    loop Simulation Loop
        Channel->>Channel: Simulate lifecycle delays & probabilities (Delivered, Opened, Clicked, Purchased)
    end
    Channel->>API: 23. POST /api/webhook/events (Telemetry event batch)
    API->>DB: 24. Deduplicate, update communications status & log events
    API->>DB: 25. Trigger async campaign analytics metrics refresh
    DB-->>API: Updated campaign metrics (CTR, conversion rate, revenue)
    Marketer->>API: 26. GET /api/campaigns/:id/metrics
    API-->>Marketer: Return campaign metrics data for UI dashboard
```

---

## 4. Split-Phase Pipelines / Core System Flow

### Pipeline 1: CSV Ingestion & Database-Backed Metrics Regeneration

#### Phase 1: CSV Upload & Raw Ingestion
*   **Inputs**: Base64 encoded strings of raw customer demographic CSV and raw purchase transaction CSV, scoped to a UUID `brand_id`.
*   **Modular Components & Directories**:
    *   **Router**: [upload.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/routes/upload.js) receives the Express HTTP POST payload, decodes Base64 to buffers, and validates structure.
    *   **Parser**: [csv-parser.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/utils/csv-parser.js) uses the memory-efficient streaming node-csv driver to parse records into JavaScript object arrays.
    *   **Injest Services**: [customer-ingestion.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/services/upload/customer-ingestion.js) and [order-ingestion.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/services/upload/order-ingestion.js) carry out the database writes.
*   **Logic Execution**: 
    *   Open raw transactions using PG `BEGIN`/`COMMIT` wrapper.
    *   Inserts customer and order records in transactional batches of `1,000` using parameterized arrays generated via `pg-format`.
*   **Safety Features**:
    *   **Database Upsert Guards**: Eliminates runtime duplicate lookup overhead by utilizing native constraints and `ON CONFLICT (brand_id, external_customer_id) DO UPDATE SET` clauses.
    *   **Size Restrictions**: The Express gateway sets JSON payload limitations (`50mb`) to prevent memory depletion from malicious large uploads.
    *   **Gateway Throttling**: Limits uploads to 5 per 10 minutes in production using rate limit middleware to protect disk and parser CPU.

#### Phase 2: Database-Backed Asynchronous Metrics Calculation
*   **Inputs**: Scoped `brand_id` and raw rows.
*   **Modular Components & Directories**:
    *   **Queue Coordinator**: [queue-manager.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/services/analytics/queue-manager.js) inserts the job task and triggers workers.
    *   **Aggregator Services**: [customer-metrics.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/services/analytics/customer-metrics.js) (calculates customer-scoped details), [dataset-summary.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/services/analytics/dataset-summary.js) (global stats), and [metric-distributions.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/services/analytics/metric-distributions.js) (charts data).
*   **Logic Execution**:
    *   Writes a job metadata log into `metrics_generation_jobs` in a `PENDING` state.
    *   Asynchronous background process fetches pending jobs. It runs a native PostgreSQL CTE aggregation script that compiles metrics:
        *   **Customer Lifetime Value (CLV)**: Sum of total successful transactions per customer.
        *   **Average Days Between Orders**: Delta gap delta calculation over historical purchases:
            $$\text{gap} = \text{order date} - \text{LAG}(\text{order date}) \text{ OVER (PARTITION BY customer id ORDER BY order date)}$$
        *   **Weighted Loyalty Score ($L \in [0, 100]$)**: Measures purchase frequencies, recency intervals, and percentile spends:
            $$L = 0.4 \cdot S_{\text{rank}} + 0.4 \cdot F_{\text{score}} + 0.2 \cdot R_{\text{score}}$$
        *   **Predictive Churn Score ($C \in [0, 100]$)**: Evaluates days since last order against average order gaps:
            $$C = \min\left(\left(\frac{\text{days since last purchase}}{\text{avg days between orders}}\right) \times 100, 100\right)$$
    *   Refreshes opportunities feed and updates job state to `COMPLETED`.
*   **Safety Features**:
    *   **FOR UPDATE SKIP LOCKED**: Background processing claims jobs inside a transactional write lock. This ensures multiple workers running on scaled instances will never process the same job or experience deadlock conflicts.
    *   **Atomic Rollbacks**: Fails safely, updating job state and writing the runtime stack trace to `error_message` inside the database to isolate metrics errors from system downtime.

---

### Pipeline 2: AI Strategist & Segmentation Compiler

#### Phase 1: Conversation Session & Filter Plan Validation
*   **Inputs**: User's natural language goal (e.g. "Draft an email targeting churn-risk VIPs in California"), brand ID, and previous session message history.
*   **Modular Components & Directories**:
    *   **Controller**: [strategist-controller.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/controllers/strategist-controller.js) coordinates standard HTTP response outputs or Server-Sent Events (SSE) stream buffers.
    *   **Chat Service**: [strategist-chat.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/services/intelligence/strategist-chat.js) builds prompt messages, fetches context variables, and executes transactions.
    *   **LLM Service**: `ai-service.js` interfaces with OpenRouter gateway parameters.
    *   **Validator**: [filter-validator.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/services/audience/filter-validator.js) parses output plans.
*   **Logic Execution**:
    *   Retrieves active session logs, dataset summaries, distribution metrics, and campaign histories.
    *   Constructs system prompt guidelines and requests JSON-formatted campaign definitions from the OpenRouter model (GPT-4o-mini).
    *   Applies a strict validation loop to verify output filters. 
    *   If validation succeeds, it generates audience preview count and calculates expected delivery, click, and conversion forecasts.
    *   Persists user prompt, strategist response, and campaign draft version updates.
*   **Safety Features**:
    *   **Prompt Hijack Defenses**: The system prompt instructs the LLM that goals are untrusted user inputs. It commands the model to ignore prompt-injection instructions attempting to disclose system files, run direct SQL updates, or bypass validation rules.
    *   **Strict Whitelist Validator**: Checks filters against `metric_registry` table schema keys. Any invalid operator, unregistered attribute (e.g. attempting to query password logs), or type mismatch triggers a fallback that drops the unsafe filters and returns the previous stable draft state.

#### Phase 2: Audience Freezing & Campaign Dispatch
*   **Inputs**: Launched campaign configuration, campaign ID, and database parameters.
*   **Modular Components & Directories**:
    *   **Controller**: [campaign-controller.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/controllers/campaign-controller.js) manages REST endpoints.
    *   **SQL Compiler**: [query-builder.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/services/audience/query-builder.js) compiles filter arrays to SQL.
    *   **Dispatcher**: [dispatcher.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/services/campaign/dispatcher.js) batches message updates.
*   **Logic Execution**:
    *   Resolves target criteria (predefined segments like "VIP" or custom filters) into query segments.
    *   Starts a database transaction: deletes existing audiences (for idempotency), queries customer keys matching targets, and bulk-inserts customer IDs into `campaign_audience` to freeze campaign scope.
    *   Generates delivery tasks in `communications` table, marked as `PENDING`.
    *   Triggers async dispatch queue. The dispatcher maps communications, interpolates message templates (e.g., replacing `{{name}}` placeholders), and POSTs batches of 100 messages to the external Channel Service.
*   **Safety Features**:
    *   **SQL Parameterization**: Compiles criteria strictly into SQL parameterized operators (`$1`, `$2`, etc.), preventing SQL injection attacks from the LLM or UI.
    *   **Audience Freezing**: Snaps customer keys into `campaign_audience` table. If customer metrics change mid-campaign, targeting parameters remain locked, maintaining historical campaign audit trails.

---

### System-Wide Graceful Fallbacks

| Failure Event | System Component | Detection Mechanism | Graceful Fallback Strategy |
| :--- | :--- | :--- | :--- |
| **Invalid AI JSON Filter Plan** | AI Strategist Validation | `filter-validator.js` throws validation error list | Self-corrects by sending details back to the LLM up to 3 times. On final attempt failure, it defaults targeting to a single safe segment from the `segment_registry` (e.g., "VIP"). |
| **Channel Service Batch Timeout** | Campaign Dispatcher | Axios POST to `/send-batch` throws a network or timeout error | Automatically disables batch dispatching (`useBatch = false`) and falls back to individual sequential HTTP POST delivery attempts. |
| **Webhook Delivery Gateway Outage** | External Channel Service | POST to CRM `/api/webhook/events` returns HTTP error (5xx, 429) | Channel Service retry engine triggers 3 retry attempts with exponential backoff (`5s * retry_count`). Unresolvable errors write status `DEAD` in SQLite. |
| **Mobile Touch Jitter / Scroll Lock** | UI Layout | Browser user-agent and viewport width matches mobile criteria | The UI layout provider disables virtual smooth-scroll wrappers, reverting to native scroll physics to prevent UI freeze. |

---

## 5. Monorepo Architecture

Catalyst organizes backend core APIs, simulated messaging services, frontend UI layers, and testing packages within a clean modular layout:

| Directory | Operational Responsibility | Key Source Files |
| :--- | :--- | :--- |
| `backend/` | Root folder containing backend dependencies, server config scripts, and dev configurations. | `package.json`, `server.js` |
| `backend/src/config/` | Application configurations and Database initialization client logic. | [db.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/config/db.js) |
| `backend/src/controllers/` | Request-response routers parsing payloads and invoking background services. | [campaign-controller.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/controllers/campaign-controller.js), [strategist-controller.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/controllers/strategist-controller.js) |
| `backend/src/db/` | DDL schema scripts, indexes, segment registers, and static configuration setups. | [schema.sql](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/db/schema.sql) |
| `backend/src/routes/` | REST mapping routing paths and rate limiting middlewares. | [audience.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/routes/audience.js), [webhook.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/routes/webhook.js) |
| `backend/src/services/ai/` | OpenRouter AI gateway connection details. | `ai-service.js` |
| `backend/src/services/analytics/` | Database-backed queue scheduler and mathematical metrics CTE engine. | [queue-manager.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/services/analytics/queue-manager.js), [customer-metrics.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/services/analytics/customer-metrics.js) |
| `backend/src/services/audience/` | Segment registry tools, filter plan validators, and parameterized query compiler. | [query-builder.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/services/audience/query-builder.js), [filter-validator.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/services/audience/filter-validator.js) |
| `backend/src/services/campaign/` | Omnichannel communication dispatcher and render template modules. | [dispatcher.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/services/campaign/dispatcher.js) |
| `backend/src/services/intelligence/` | Opportunity feed triggers, executive brief utilities, and continuous chat service. | [strategist-chat.js](file:///home/shamky/Ayush%20programming/Catalyst/backend/src/services/intelligence/strategist-chat.js) |
| `backend/src/utils/` | Shared utilities, such as CSV parsing wrappers. | `csv-parser.js` |
| `channel_service/` | External omnichannel simulator microservice. Simulates delivery events. | `server.js`, `channel_service.db` |
| `frontend/` | React 19 + TypeScript + Vite single page application workspace. | `package.json`, `index.html` |
| `frontend/src/components/` | Visual components, layout structures, and scroll providers. | `Navbar.tsx`, `SmoothScrollProvider.tsx` |
| `frontend/src/context/` | React state context files (Workspace brand ID state, toast alerts state). | `WorkspaceContext.tsx`, `ToastContext.tsx` |
| `frontend/src/pages/` | Visual layout pages, interactive strategist dashboard, analytics reports. | [BrandSetupPage.tsx](file:///home/shamky/Ayush%20programming/Catalyst/frontend/src/pages/BrandSetupPage.tsx), [StrategistPage.tsx](file:///home/shamky/Ayush%20programming/Catalyst/frontend/src/pages/StrategistPage.tsx) |
| `frontend/src/services/` | HTTP communication services mapping REST endpoints. | [brandService.ts](file:///home/shamky/Ayush%20programming/Catalyst/frontend/src/services/brandService.ts) |
| `test/` | Monorepo integration, API routers, and AI system test suites. | [smoke-test.js](file:///home/shamky/Ayush%20programming/Catalyst/test/smoke-test.js), [ai-smoke-test.js](file:///home/shamky/Ayush%20programming/Catalyst/test/ai-smoke-test.js) |

---

## 6. Key Features & Advanced Safeguards

*   **Deduplicated Ingestion Architecture**: The raw data ingestion pipeline utilizes Postgres unique constraints `(brand_id, external_customer_id)`, `(brand_id, email)`, and `(brand_id, phone)` with custom `ON CONFLICT DO UPDATE SET` clauses. This resolves customer records collision and duplicate orders at the database engine level, removing the need for memory-heavy validation loops.
*   **Registry-Based Query Whitelist**: Dynamic segment queries are compiled by validating JSON structures against registered tables. Attempted SQL statements containing unauthorized database columns or operators (such as trying to load system tables) are rejected, ensuring complete safety from injection attacks.
*   **Transaction-Isolated Background Processing**: Uses native Postgres transactional locks (`FOR UPDATE SKIP LOCKED`) inside the queue coordinator loop. This permits concurrent processes to scale up without executing duplicate tasks or facing deadlock scenarios.
*   **Idempotent Telemetry Webhooks**: The webhook controller validates incoming events and drops duplicates using `ON CONFLICT (communication_id, event_type) DO NOTHING` constraints. It enforces a strict status progression (`SENT -> DELIVERED -> OPENED -> CLICKED -> PURCHASED`) to prevent late events from rewriting history.
*   **Upload Rate Throttling**: Restricts heavy base64 CSV uploads using strict route-limiting middleware. Limits are set to 5 uploads per 10 minutes in production, protecting database connection pools and network bandwidth from overload.
*   **Responsive Scrolling Adjustments**: Bypasses the virtual smooth-scroll Lenis engine on viewports smaller than `768px` or touch interfaces. This prevents layout jitter on mobile screens, aligning with best practices for mobile usability.

---

## 7. Engineering Trade-offs

### Trade-off 1: Asynchronous Database-Backed Job Queue vs. Distributed Broker (Redis/BullMQ)
*   **Context**: Catalyst uses PostgreSQL tables with `FOR UPDATE SKIP LOCKED` transaction polling for background metrics jobs instead of standalone message brokers like Redis/BullMQ.
*   **Contrast & Evaluate**:
    *   *The Case for Database Queueing*: Extreme simplicity, zero infrastructure overhead, and absolute transactional integrity. If a brand database write fails, the metrics regeneration job rolls back, preventing orphaned tasks.
    *   *The Case for Redis/BullMQ*: Higher throughput, memory-based queuing latency, and lower CPU overhead compared to SQL polling.
*   **Consequence**: Choosing PostgreSQL keeps deployment simple and reliable for standard enterprise workloads. However, under high concurrency (e.g., hundreds of brands recomputing data simultaneously), database connection limits and table lock contention will increase.

### Trade-off 2: Registry-Validated Filter Plan Compiler vs. Direct LLM Text-to-SQL Generation
*   **Context**: The LLM outputs a structured JSON filter plan that the query builder compiles, rather than generating SQL strings directly.
*   **Contrast & Evaluate**:
    *   *The Case for Structured Filter Plans*: Complete protection against SQL injection and database schema leakage. Validation matches fields against the whitelisted `metric_registry`.
    *   *The Case for Direct SQL*: Maximum flexibility. The AI can write complex queries using joins, subqueries, or functions not supported by the registry.
*   **Consequence**: Security is prioritized over flexibility. Marketers cannot create complex query rules outside the predefined columns in the registry, but the system is completely insulated from prompt injection exploits.

### Trade-off 3: Database-Native CTE Window Calculations vs. Application-Memory Aggregations
*   **Context**: Customer metrics are calculated using complex PostgreSQL Common Table Expressions (CTEs) containing window functions (`LAG OVER PARTITION BY`), percentile conts (`PERCENTILE_CONT`), and aggregations.
*   **Contrast & Evaluate**:
    *   *The Case for Database-Native Calculation*: Extremely fast. Aggregations run next to the storage layer, removing the need to pull millions of rows into Node.js application memory.
    *   *The Case for Application-Memory Aggregations*: Simpler debugging, testability, and database portability.
*   **Consequence**: Performance is prioritized. Catalyst is highly performant under large data volumes, but the backend is tightly coupled to PostgreSQL syntax (such as CTEs and Window Functions), making migrations to other database engines (like SQLite or MongoDB) difficult without a complete rewrite of the analytics layer.

### Trade-off 4: Monolithic Webhook Logging vs. Distributed Streaming (Apache Kafka)
*   **Context**: Delivery telemetry events from the Channel Service are delivered via bulk HTTP POST requests to `/api/webhook/events`, rather than streaming to Kafka or RabbitMQ.
*   **Contrast & Evaluate**:
    *   *The Case for Monolithic Webhook Logging*: Extremely easy to configure, run locally, and debug. Simple to deploy without managing distributed streaming clusters.
    *   *The Case for Distributed Streaming*: Non-blocking asynchronous event processing. Heavy webhooks are handled by partition consumers without blocking the API gateway thread.
*   **Consequence**: The system is simpler to maintain and deploy. However, under massive campaign dispatches (e.g., millions of messages generating concurrent events), database connection write pools will saturate, potentially impacting API gateway responsiveness.

---

## 8. Tech Stack & Technology Selection

| Architectural Layer | Chosen Technology | Rationale |
| :--- | :--- | :--- |
| **Backend Core** | Express 5 / Node.js | Provides native promise support in router handlers, a mature middleware ecosystem, and simplified async error catching. |
| **Database** | PostgreSQL | Supports relational structure, transaction safety, and advanced window functions (CTE, percentiles) for analytics. |
| **AI Gateway** | OpenRouter (GPT-4o-mini) | Offers unified API access to multiple LLM providers with consistent JSON schema output parameters. |
| **Simulator Database** | SQLite | Offers a lightweight, zero-configuration embedded database engine inside the mock channel microservice. |
| **Frontend Framework** | React 19 / Vite | Enables fast builds, HMR support, and smooth rendering of responsive component states. |
| **Interactive Graphs** | Recharts | Provides responsive, SVG-based charting components that fit within the layout grid. |
| **Fluid Animations** | Framer Motion | Provides smooth transitions, micro-interactions, and hardware-accelerated interface states. |
| **Scrolling Engine** | Lenis | Delivers smooth, premium inertia scrolling behavior across modern desktop browsers. |

---

## 9. Project Structure (ASCII Directory Map)

```
Catalyst/                               # Project root directory
├── backend/                            # Backend CRM application
│   ├── src/                            # Backend source code
│   │   ├── app.js                      # Express application setup, middlewares, global error handler
│   │   ├── server.js                   # Node.js entry point, starts the HTTP server on PORT
│   │   ├── config/                     # Configuration files
│   │   │   └── db.js                   # PostgreSQL connection pool configuration and exports
│   │   ├── controllers/                # REST controller handlers
│   │   │   ├── brand-controller.js     # Manages brand creation, dashboards, and analytical details
│   │   │   ├── campaign-controller.js  # Campaign lifecycle CRUD, execution, target audience compile
│   │   │   ├── intelligence-controller.js # Opportunities feed, executive brief API formats
│   │   │   ├── metrics-controller.js   # Health matrix and value pyramid data fetchers
│   │   │   ├── strategist-controller.js # AI Strategist continuous chat and streaming SSE actions
│   │   │   └── webhook-controller.js   # Processes batch/singular events hooks from channel service
│   │   ├── db/                         # Database schema definition files
│   │   │   └── schema.sql              # Core DDL scripts, constraints, metric & segment registries, index creations
│   │   ├── routes/                     # Express REST route mapping
│   │   │   ├── audience.js             # Segment discovery endpoints
│   │   │   ├── brands.js               # Brand dashboard endpoints
│   │   │   ├── campaigns.js            # Campaign proposals, updates, and executions routes
│   │   │   ├── intelligence.js         # AI Strategist sessions, opportunity alerts, executive briefs
│   │   │   ├── metrics.js              # Metrics rebuild triggers, queue jobs tracker endpoints
│   │   │   ├── upload.js               # Customer & Order CSV upload routes
│   │   │   └── webhook.js              # Telemetry webhook event receiver
│   │   ├── services/                   # Application service layer containing modular logic
│   │   │   ├── ai/                     # AI engine integrations
│   │   │   │   └── ai-service.js       # Core OpenRouter API configuration and completion handler
│   │   │   ├── analytics/              # Data calculation and background workers
│   │   │   │   ├── campaign-analytics.js # Recompiles CTR, open rates, conversions, campaign revenues
│   │   │   │   ├── customer-metrics.js # Postgres CTE calculation scripts for CLV, loyalty, churn
│   │   │   │   ├── dataset-summary.js  # Recomputes global averages, medians, percentile thresholds
│   │   │   │   ├── metric-distributions.js # Dashboard frequency histograms generator
│   │   │   │   ├── metric-registry.js  # Seeds metrics catalog fields
│   │   │   │   ├── queue-manager.js    # Asynchronous DB-backed task scheduler (FOR UPDATE SKIP LOCKED)
│   │   │   │   └── segment-registry.js # Seeds semantic segment shortcuts catalog
│   │   │   ├── audience/               # Targeting compilation services
│   │   │   │   ├── ai-strategist.js    # (Legacy V1) Proposer strategist rules
│   │   │   │   ├── audience-context.js # Pulls context parameters for LLM strategist reasoning
│   │   │   │   ├── audience-preview.js # Generates test targets lists
│   │   │   │   ├── filter-validator.js # Schema validation of AI-created JSON filter structures
│   │   │   │   ├── forecasting-engine.js # Mathematical conversion forecasts compiler
│   │   │   │   └── query-builder.js    # Translates filter plans into parameterized SQL queries
│   │   │   ├── campaign/               # Campaign services
│   │   │   │   └── dispatcher.js       # Dispatches campaign communications (Batch/Singular fallbacks)
│   │   │   └── intelligence/           # Analytical business insights
│   │   │   │   ├── campaign-intelligence.js # Historical performance matrix compiler
│   │   │   │   ├── executive-brief.js   # Generates overview corporate brief summaries
│   │   │   │   ├── opportunity-feed.js  # Deterministic triggers for VIP churn & inactive alerts
│   │   │   │   └── strategist-chat.js   # V2 continuous strategist chat orchestration
│   │   │   └── webhook/                # Webhook integration services
│   │   ├── utils/                      # Helper libraries
│   │   │   └── csv-parser.js           # CSV file parsing wrapper using csv-parse
│   │   └── package.json                # Backend dependency definitions and scripts
│   └── .env                            # Backend local environment keys configuration
├── channel_service/                    # Omnichannel simulator microservice
│   ├── server.js                       # Express simulator server: message storage, events simulation, hooks batching
│   ├── channel_service.db              # SQLite database storing simulated delivery states
│   └── package.json                    # Channel service configurations
├── frontend/                           # React frontend Single Page Application (SPA)
│   ├── src/                            # Frontend source files
│   │   ├── main.tsx                    # React application bootstrap and entry
│   │   ├── App.tsx                     # Main layout Router, page routes, provider setups
│   │   ├── components/                 # Reusable UI component modules
│   │   │   └── layout/                 # Layout structure utilities (Navbar, SmoothScrollProvider, skeletons)
│   │   ├── context/                    # React Context providers
│   │   │   ├── WorkspaceContext.tsx    # Brand/tenant state, current brand identifier
│   │   │   └── ToastContext.tsx        # Toast messaging providers
│   │   ├── pages/                      # Application Page components
│   │   │   ├── LandingPage.tsx         # Catalyst portal entrance layout
│   │   │   ├── BrandSetupPage.tsx      # Tenant creation, data upload, metrics rebuild monitor
│   │   │   ├── OverviewPage.tsx        # Brand main cockpit (briefs, campaign list, opportunity alerts)
│   │   │   ├── StrategistPage.tsx      # AI conversational interface, drafts designer, audience preview widget
│   │   │   ├── CampaignsPage.tsx       # Campaign overview logs and status metrics
│   │   │   ├── CampaignDetailsPage.tsx # Delivery funnel chart, execution events stream logs
│   │   │   ├── AnalyticsPage.tsx       # Core dashboards (distributions, loyalty, value pyramid tables)
│   │   │   └── DocxPage.tsx            # Built-in developer guidelines and API docs
│   │   ├── services/                   # Frontend API wrappers
│   │   │   └── brandService.ts         # Axios requests wrapper, SSE client-side streaming handlers
│   │   ├── styles/                     # Layout styles
│   │   │   └── App.css                 # Custom styling tokens and animations
│   │   └── package.json                # Frontend dependency definitions and scripts
│   └── .env                            # Frontend local build environments configuration
├── test/                               # Testing pipeline folder
│   ├── integration.js                  # Main integration suite entry
│   ├── smoke-test.js                   # Simulates full upload, ingestion, queue and metrics rebuild verification
│   ├── api-smoke-test.js               # Basic router sanity verifier
│   ├── ai-smoke-test.js                # LLM strategist audience discovery and campaign propose testing
│   ├── package.json                    # Testing library definitions
│   └── run-smoke-test.sh               # Shell script executing smoke test sweeps
└── README.md                           # Main project documentation file
```

---

## 10. Prerequisites & Environment Variables

To run Catalyst locally, ensure the following tools are installed:
*   **Runtime Environment**: Node.js `v18.0.0` or higher (recommended: `v20.x`) and npm `v9.x` or higher.
*   **Database**: PostgreSQL `v14` or higher (accessible locally or hosted, with schema privileges).
*   **API Credentials**: OpenRouter account and API key to connect to generative models.

### Environment Variable Templates

Create a `.env` file in the `backend` directory:

```env
# ==============================================================================
# Server Configuration
# ==============================================================================
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# ==============================================================================
# Database Configuration
# ==============================================================================
# Connection string for your target PostgreSQL database (SSL mode required for hosts like Neon)
DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/<dbname>?sslmode=verify-full

# ==============================================================================
# Third-Party AI Services (OpenRouter)
# ==============================================================================
# OpenRouter API Key for authenticating LLM queries
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxx
# Target LLM model selection
OPENROUTER_MODEL=openai/gpt-4o-mini

# ==============================================================================
# Microservices Integration
# ==============================================================================
# Connection endpoint for the simulated channel messaging service
CHANNEL_SERVICE_URL=http://localhost:3001
```

Create a `.env` file in the `frontend` directory:

```env
# ==============================================================================
# Catalyst Frontend Environment Configuration
# ==============================================================================
# Points Vite to the core Express backend gateway REST endpoint
VITE_API_URL=http://localhost:5000/api
```

---

## 11. Running Locally

### Bare-Metal Execution

Follow these steps to run the application components in separate terminal windows:

#### Step 1: Initialize the Database Schema
Execute the schema setup script against your PostgreSQL instance to create the database tables, indices, and constraints:
```bash
# Set environment variable and run the schema file
psql -d <your-database-name> -f backend/src/db/schema.sql
```

#### Step 2: Start the Backend Gateway API
```bash
cd backend
npm install
npm run dev
```
The gateway will start on port `5000`. You can verify it is running by checking `http://localhost:5000/health`.

#### Step 3: Start the Simulated Channel Service
```bash
cd channel_service
npm install
node server.js
```
The simulator starts on port `3001` and initializes `channel_service.db`.

#### Step 4: Start the Frontend Application
```bash
cd frontend
npm install
npm run dev
```
Vite will compile and launch the React client, typically running on `http://localhost:3000`.

---

### Docker Compose Alternative

You can also run the entire system inside Docker containers. Add a `docker-compose.yml` file to the root of the project:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: catalyst-db
    environment:
      POSTGRES_USER: catalyst_user
      POSTGRES_PASSWORD: secretpassword
      POSTGRES_DB: catalyst_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    container_name: catalyst-backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://catalyst_user:secretpassword@postgres:5432/catalyst_dev?sslmode=disable
      - PORT=5000
      - OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxx
      - OPENROUTER_MODEL=openai/gpt-4o-mini
      - CHANNEL_SERVICE_URL=http://channel-service:3001
      - FRONTEND_URL=http://localhost:3000
    depends_on:
      - postgres

  channel-service:
    build: ./channel_service
    container_name: catalyst-channel-service
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - CRM_WEBHOOK_URL=http://backend:5000/api/webhook/events

  frontend:
    build: ./frontend
    container_name: catalyst-frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:5000/api
    depends_on:
      - backend

volumes:
  postgres_data:
```

Launch all services with a single command:
```bash
docker-compose up --build
```

---

### Verifying the Installation

To verify that all services are working correctly, run the integration and smoke tests:

```bash
cd test
npm install

# Run the integration test suite
# This seeds a brand, uploads sample CSV files, verifies ingestion, and triggers metrics generation
npm run test:smoke

# Run backend API router checks
node api-smoke-test.js

# Test AI segment discovery and campaign drafting
npm run test:ai "Find high spenders in California and create an email campaign"
```

---

## 12. System Taxonomy / Internal Configuration Matrices

### Error Taxonomy Classifications

| Error Code | Layer | Root Cause | System Recovery Action |
| :--- | :--- | :--- | :--- |
| **UPLOAD_ERROR** | Ingestion | Base64 decode failed, CSV file is corrupted, or required columns are missing. | Aborts transaction, rolls back database changes, and returns an HTTP `400` status. |
| **METRICS_FAILED** | Analytics | CTE calculation failed due to invalid order dates or division-by-zero errors. | Logs stack trace to `metrics_generation_jobs`, sets job status to `FAILED`, and releases locks. |
| **STRATEGIST_ERROR** | AI Gateway | OpenRouter API key is invalid, request timed out, or rate limits were exceeded. | Retries request. If issues persist, returns an HTTP `500` status. |
| **VALIDATION_FAILED** | Compiler | AI-generated filter plan references columns not in registry or uses invalid operators. | Discards custom filters and falls back to a predefined segment template. |
| **DISPATCH_FAILED** | Dispatcher | Connection to Channel Service timed out or payload size was exceeded. | Disables batch dispatching and falls back to individual sequential delivery. |

### System Configuration Thresholds

*   **Max Custom Filters**: `5` (enforced by the validator to prevent slow database queries).
*   **File Upload Size Limit**: `50MB` (protects memory resources).
*   **Ingestion Batch Size**: `1000` records per insert statement.
*   **Webhook Dispatch Batch Size**: `100` messages per request.
*   **Webhook Queue Flush Interval**: `500ms`.
*   **OpenRouter Temperature Values**:
    *   *Pass 1 (Audience Discovery)*: `0.1` (ensures consistent target filter output).
    *   *Pass 2 (Campaign Propose)*: `0.3` (balances structured output with creative copy).
    *   *V2 Continuous Chat*: `0.5` (enables conversational dialogue).
*   **Touch Screen Viewport Cutoff**: `< 768px` (disables Lenis scroll rendering).

---

## 13. Comprehensive API Routes Table

### Brand Management Routes
*   `POST /api/brands` - Create a new tenant brand.
*   `GET /api/brands` - List all tenant brands.
*   `GET /api/brands/:id` - Fetch overview KPI statistics for a brand dashboard.
*   `GET /api/brands/:id/analytics` - Get charts and distribution metrics (loyalty, spend intervals).

### Data Upload Routes
*   `POST /api/upload` - Upload Base64 encoded customer and order CSV files (triggers metrics generation).

### Metrics & Analytics Routes
*   `POST /api/metrics/rebuild` - Manually trigger background metrics calculations.
*   `GET /api/metrics/jobs/:jobId` - Check status, progress, and error details of a metrics job.
*   `GET /api/metrics/history/:brandId` - Get list of recent metrics calculations for a brand.
*   `GET /api/metrics/brands/:brandId/health-matrix` - Get customer health metrics.
*   `GET /api/metrics/brands/:brandId/value-pyramid` - Get customer lifetime value distribution.

### AI Strategist Chat (V2) Routes
*   `POST /api/intelligence/:brandId/strategist/chat` - Talk to the AI strategist.
*   `POST /api/intelligence/:brandId/strategist/chat/stream` - SSE stream of the AI strategist conversation.
*   `GET /api/intelligence/:brandId/strategist/session/:sessionId` - Get session message history and latest campaign draft.
*   `GET /api/intelligence/:brandId/strategist/sessions` - List active chat sessions for a brand.
*   `DELETE /api/intelligence/:brandId/strategist/session/:sessionId` - Delete an active chat session.
*   `POST /api/intelligence/:brandId/strategist/launch` - Convert a campaign draft into a campaign and lock the chat session.

### Intelligence Feed Routes
*   `GET /api/intelligence/:brandId/opportunities` - Get deterministic alert feed (e.g., churn risks, VIP customers).
*   `GET /api/intelligence/:brandId/executive-brief` - Generate an LLM-powered overview health report.

### Audience Discovery (V1) Routes
*   `POST /api/audience/discover` - Run V1 AI pass to get audience size and filters.

### Campaign Management Routes
*   `GET /api/campaigns` - List all campaigns.
*   `GET /api/campaigns/:id` - Get details for a campaign.
*   `PATCH /api/campaigns/:id` - Edit parameters of a campaign draft (name, channel, template).
*   `DELETE /api/campaigns/:id` - Delete a campaign draft.
*   `POST /api/campaigns/:id/execute` - Launch campaign: freezes audience and dispatches messages.
*   `GET /api/campaigns/:id/metrics` - Fetch delivery telemetry metrics.
*   `GET /api/campaigns/:id/milestones` - Get campaign draft version milestones history.
*   `GET /api/campaigns/:id/activity` - Get campaign communication log entries.

### Webhook Routes
*   `POST /api/webhook/events` - Batched telemetry hook event listener for delivery simulation updates.
