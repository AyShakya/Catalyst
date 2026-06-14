# Catalyst - AI Marketing Strategist

## Problem
Brands struggle to identify the right audience segments and craft personalized, high-converting campaigns across fragmented data silos. Traditional CRMs require manual segment building and repetitive message drafting, leading to slow execution and missed growth opportunities.

## Solution
Catalyst is an AI-native CRM that empowers marketers to architect, launch, and analyze multi-channel campaigns through natural language. By integrating raw customer data with an autonomous intelligence layer, Catalyst transforms data ingestion into actionable strategy in seconds.

## Features
- Chunked Bulk Data Ingestion: High-performance processing for large-scale customer and order history.
- Autonomous Opportunity Detection: SQL-based detectors identify VIP churn, one-time buyers, and regional trends.
- Conversational Strategy Interface: An AI-driven chat environment for campaign planning and versioning.
- Executive Health Dashboard: Real-time visualization of business KPIs, loyalty scores, and revenue DNA.
- Multi-Channel Dispatch: Integrated delivery system for WhatsApp, SMS, and Email campaigns.
- Real-Time Analytics: Live tracking of delivery, open, and conversion rates with AI-modeled forecasting.

## Architecture

```text
[ Data Ingestion Layer ] -> [ Analytical Engine ] -> [ Intelligence Layer ]
       (CSV/Bulk)            (Postgres/CTEs)         (AI Strategist)
                                   |                       |
                                   v                       v
[ Business Health UI ] <- [ Metrics Registry ] <- [ Campaign Dispatcher ]
    (React/Vite)                                    (Channel Service)
```

## AI Capabilities

### AI Audience Generation
The system utilizes LLM workflows to translate natural language goals (e.g., "Target high-spend customers in Mumbai who are at risk of churning") into precise database filters. This eliminates the need for manual SQL or complex segment builders.

### AI Message Creation
Catalyst generates personalized message templates for WhatsApp, SMS, and Email. The AI adapts the tone and content based on the campaign's specific goals and the target segment's behavior (e.g., urgency for churned users, premium tone for VIPs).

### AI Campaign Recommendations
Through the Opportunity Feed, the system proactively suggests campaign strategies based on identified business gaps. It analyzes customer lifetime value and purchase frequency to recommend specific interventions.

### AI Channel Recommendations
The Campaign Intelligence service aggregates historical performance data across different goals. The AI uses this data to recommend the most effective communication channel (e.g., Email for newsletters vs. SMS for flash sales) to maximize conversion rates.

## Scale Considerations

### Current Assumptions and Constraints
- Dataset Scale: Optimized for up to 10,000 customers per brand.
- Campaign Volume: Designed to support 100 campaign launches per day.
- Delivery Model: Utilizes simulated delivery loops for rapid prototyping and feedback.
- Processing: Current synchronous ingestion assumes datasets of up to 25,000 records per upload to stay within standard HTTP timeout windows (30-60 seconds).

### Production Roadmap Improvements
- Event Streaming: Integration of Apache Kafka for high-throughput, asynchronous event processing.
- Advanced Caching: Implementation of Redis for distributed session management and real-time analytical caching.
- Background Workers: Migration of data ingestion and campaign dispatching to dedicated worker clusters (e.g., BullMQ) to handle 1M+ records.
- Event Sourcing: Transitioning the communication log to an event-sourced architecture for absolute data auditability.
- Horizontal Scaling: Containerized service architecture designed for elastic scaling across Kubernetes clusters.

## Technical Stack

### Frontend
- React 19, TypeScript, Vite 8
- Tailwind CSS, Framer Motion
- Recharts, Lucide React

### Backend
- Node.js, Express 5
- PostgreSQL (Analytical CTEs)
- OpenRouter AI (LLM Orchestration)
- pg-format (Bulk SQL Optimization)
