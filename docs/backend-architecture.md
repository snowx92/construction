# Tender.ai — Backend Architecture & Product Brief

**For:** Tech Lead / Backend Team  
**Date:** May 2026  ss
**Project:** Construction Tender Intelligence SaaS

---

## 1. Executive Summary

Tender.ai is a SaaS platform for construction contractors that automates the tender lifecycle: upload a tender package → AI extracts the BOQ and risks → pricing is sourced from live market data → full proposal documents (technical, financial, method statement, programme) are generated and ready for submission.

The frontend is complete in Next.js 14 (App Router). The backend does not exist yet — this document specifies everything needed to make the frontend fully operational.

**Key numbers at scale target (year 1):**
- 500 contractor organisations, avg 5 users each
- 20,000 project workspaces
- 200 file uploads/day (PDF, DWG, XLSX)
- 50 LLM generation jobs/day

---

## 2. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| **API** | Next.js Route Handlers (co-located) | No separate server needed for v1; move to standalone Node if needed |
| **Database** | Supabase (PostgreSQL 15) | Row-level security, built-in auth, real-time, generous free tier |
| **Auth** | Supabase Auth | Email/password + magic link + Google OAuth; JWT with org claims |
| **File Storage** | Supabase Storage | S3-compatible, integrated with RLS, direct upload from client |
| **Background Jobs** | BullMQ + Redis (Upstash) | Queue file processing + LLM generation; retry logic; prioritisation |
| **LLM** | Anthropic Claude API | claude-sonnet-4-5 for generation, claude-haiku-4-5 for classification |
| **PDF Parsing** | AWS Textract (async) | DWG/PDF structural extraction; falls back to pdfium for text-only PDFs |
| **Cache** | Upstash Redis | Rate limiting, LLM response cache, session store |
| **Email** | Resend | Transactional: invite, proposal ready, deadline alerts |
| **Payments** | Stripe | Subscription billing: Starter / Pro / Business / Enterprise |
| **Monitoring** | Sentry + Vercel Analytics | Error tracking, Web Vitals, LLM cost tracking |
| **Deployment** | Vercel (frontend) + Railway (workers) | Workers need persistent process; Vercel serverless for API |

---

## 3. Database Schema

### 3.1 Multi-tenancy model

Every table has an `org_id` column. Supabase Row Level Security (RLS) policies enforce `auth.jwt() -> org_id = org_id` on every read/write. Users belong to exactly one org.

```sql
-- Core org/user tables
organisations (
  id uuid PK,
  name text,
  slug text UNIQUE,         -- used in URLs
  plan text,                -- starter | pro | business | enterprise
  country text,             -- ae | om | eg | sa — default market
  logo_url text,
  created_at timestamptz
)

users (
  id uuid PK,               -- = auth.users.id
  org_id uuid FK,
  full_name text,
  role text,                -- owner | admin | member | viewer
  avatar_url text,
  created_at timestamptz
)

-- Company profile (one per org)
company_profiles (
  id uuid PK,
  org_id uuid FK UNIQUE,
  legal_name text,
  trade_name text,
  registration text,
  vat_number text,
  established int,
  headquarters text,
  website text,
  description text,
  tagline text,
  vision text,
  bio text,
  linkedin text,
  instagram text,
  twitter text,
  certifications text[],
  updated_at timestamptz
)

-- Child tables of company_profiles (normalised)
past_projects (
  id uuid PK,
  org_id uuid FK,
  name text,
  client text,
  value numeric,
  year int,
  status text,
  category text,
  description text
)

staff_members (
  id uuid PK,
  org_id uuid FK,
  name text,
  employee_id text,
  passport_id text,
  title text,
  department text,
  reports_to text,
  email text,
  phone text,
  nationality text
)

equipment_items (
  id uuid PK,
  org_id uuid FK,
  name text,
  category text,
  model text,
  ownership text,           -- owned | leased | subcontract
  quantity int,
  year_acquired int,
  daily_rate numeric,
  status text,              -- available | in_use | maintenance | retired
  notes text
)

labour_categories (
  id uuid PK,
  org_id uuid FK,
  title text,
  trade text,
  headcount int,
  daily_rate numeric,
  skill_level text,         -- skilled | semi_skilled | unskilled | supervisor
  nationality text,
  notes text
)

-- Tenders
tenders (
  id uuid PK,
  org_id uuid FK,
  title text,
  client text,
  status text,              -- pending | analyzing | ready | proposal_sent | won | lost
  deadline timestamptz,
  value numeric,
  tags text[],
  submitted_at timestamptz,
  created_by uuid FK
)

tender_files (
  id uuid PK,
  tender_id uuid FK,
  storage_path text,        -- Supabase Storage path
  name text,
  type text,                -- pdf | dwg | xlsx | docx | image | other
  size_bytes bigint,
  ai_processed bool DEFAULT false,
  processing_stage text,    -- uploaded | parsing | extracting | pricing | ready | error
  created_at timestamptz
)

tender_analyses (
  id uuid PK,
  tender_id uuid FK UNIQUE,
  summary text,
  requirements jsonb,
  risks jsonb,
  penalties jsonb,
  deadlines jsonb,
  boq_items jsonb,
  estimated_value numeric,
  complexity text,
  missing_info jsonb,
  ai_confidence numeric,
  model_used text,
  prompt_tokens int,
  completion_tokens int,
  cached_tokens int,
  created_at timestamptz
)

-- Project workspaces
project_workspaces (
  id uuid PK,
  org_id uuid FK,
  name text,
  status text,              -- new | uploading | analyzing | ready | in_progress | completed
  client_name text,
  project_type text,
  country text,
  tender_id uuid FK nullable,
  pricing_source text,      -- scraped | uploaded
  pinned bool DEFAULT false,
  created_by uuid FK,
  created_at timestamptz,
  updated_at timestamptz
)

workspace_files (
  id uuid PK,
  workspace_id uuid FK,
  storage_path text,
  name text,
  type text,
  size_bytes bigint,
  ai_processed bool DEFAULT false,
  processing_stage text,
  created_at timestamptz
)

generated_proposals (
  id uuid PK,
  workspace_id uuid FK,
  type text,                -- tender_submission | tender_overview | risk_assessment |
                            -- boq_report | technical_proposal | company_profile |
                            -- method_statement | scope_of_work | execution_plan | financial_proposal
  title text,
  status text,              -- pending | generating | ready
  sections jsonb,           -- [{id, heading, body}]
  word_count int,
  model_used text,
  prompt_tokens int,
  completion_tokens int,
  cached_tokens int,
  created_at timestamptz,
  updated_at timestamptz
)

boq_items (
  id uuid PK,
  workspace_id uuid FK,
  description text,
  unit text,
  quantity numeric,
  unit_price numeric,
  total numeric,
  category text,
  source text               -- ai_extracted | manual | uploaded
)

pricing_items (
  id uuid PK,
  workspace_id uuid FK,
  description text,
  unit text,
  unit_price numeric,
  tender_rate numeric,
  variance numeric,
  source text,
  valid_until date
)

financial_analyses (
  id uuid PK,
  workspace_id uuid FK UNIQUE,
  total_cost numeric,
  margin numeric,
  suggested_price numeric,
  labour_cost numeric,
  material_cost numeric,
  equipment_cost numeric,
  overhead_cost numeric,
  risk_buffer numeric,
  breakdown jsonb,
  notes text[],
  created_at timestamptz
)

-- Market material pricing
material_prices (
  id uuid PK,
  name text,
  category text,
  unit text,
  country text,             -- ae | om | eg | sa
  current_price numeric,
  previous_price numeric,
  market_price numeric,
  trend text,               -- up | down | stable
  change_percent numeric,
  sparkline jsonb,
  source text,
  last_updated timestamptz
)

-- AI Insights
ai_insights (
  id uuid PK,
  org_id uuid FK,
  type text,                -- risk | opportunity | pricing | vendor | market
  title text,
  body text,
  severity text,            -- low | medium | high | critical
  related_type text,
  related_id uuid,
  related_label text,
  read bool DEFAULT false,
  created_at timestamptz
)

-- Subscriptions (maintained by Stripe webhooks)
subscriptions (
  id uuid PK,
  org_id uuid FK UNIQUE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text,                -- starter | pro | business | enterprise
  status text,              -- active | trialing | past_due | canceled
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  max_projects int,         -- null = unlimited
  max_users int,
  features text[]
)
```

---

## 4. API Routes

All under `/app/api/` (Next.js Route Handlers). Auth middleware validates the Supabase JWT and injects `{ orgId, userId, role }` into every handler.

```
POST   /api/auth/invite                    Invite user to org

GET    /api/org/profile                    Get company profile
PUT    /api/org/profile                    Update company profile

POST   /api/tenders                        Create tender
GET    /api/tenders                        List tenders (paginated)
GET    /api/tenders/:id                    Get tender + analysis
DELETE /api/tenders/:id
POST   /api/tenders/:id/files              Upload file → triggers pipeline job
DELETE /api/tenders/:id/files/:fileId
POST   /api/tenders/:id/analyze            Trigger full LLM analysis

POST   /api/workspaces                     Create workspace
GET    /api/workspaces                     List (paginated + search)
GET    /api/workspaces/:id                 Get full workspace
DELETE /api/workspaces/:id
PATCH  /api/workspaces/:id                 Rename, pin, update status

GET    /api/workspaces/:id/boq             Get BOQ items
POST   /api/workspaces/:id/boq             Add/update items (manual or AI)
POST   /api/workspaces/:id/boq/extract     Trigger AI BOQ extraction

GET    /api/workspaces/:id/pricing         Get pricing items
POST   /api/workspaces/:id/pricing/scrape  Trigger market price scrape
POST   /api/workspaces/:id/pricing/upload  Upload pricing sheet (XLSX)

GET    /api/workspaces/:id/proposals       List proposals
POST   /api/workspaces/:id/proposals       Generate a proposal (queues job)
GET    /api/workspaces/:id/proposals/:id
PATCH  /api/workspaces/:id/proposals/:id   Edit sections
DELETE /api/workspaces/:id/proposals/:id

GET    /api/workspaces/:id/financial       Get financial analysis
POST   /api/workspaces/:id/financial       Generate financial analysis

GET    /api/pricing/materials              Market material prices
POST   /api/pricing/materials/refresh      Trigger price refresh job

GET    /api/insights                       List AI insights for org
PATCH  /api/insights/:id                   Mark read / dismiss

POST   /api/copilot/chat                   Project-scoped chat (streaming SSE)

GET    /api/billing/plans                  List plans + current subscription
POST   /api/billing/checkout               Create Stripe Checkout session
POST   /api/billing/portal                 Create Stripe Customer Portal session
POST   /api/billing/webhook                Stripe webhook handler
```

---

## 5. LLM Integration

### 5.1 Model routing

| Task | Model | Reason |
|---|---|---|
| Simple classification / tagging | `claude-haiku-4-5` | Fast, cheap, good enough |
| Standard proposal generation | `claude-sonnet-4-5` | Default for all generation |
| Complex multi-doc tender analysis | `claude-sonnet-4-5` + extended thinking | Full document comprehension |

### 5.2 Prompt caching (critical for cost)

Every LLM call that references tender documents uses `cache_control: { type: "ephemeral" }` on the document blocks. The 5-minute TTL means a full proposal run (6 documents) reuses the same cached context, reducing token cost by ~80%.

```typescript
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-5",
  max_tokens: 4096,
  system: [
    {
      type: "text",
      text: SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" },    // cached across all calls in session
    },
  ],
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: companyProfileContext,
          cache_control: { type: "ephemeral" }, // org-level cache (reused across all projects)
        },
        {
          type: "text",
          text: tenderDocumentText,
          cache_control: { type: "ephemeral" }, // per-tender cache (reused across all proposals)
        },
        {
          type: "text",
          text: taskPrompt,                      // not cached — varies per call
        },
      ],
    },
  ],
});
```

### 5.3 Background job queues (BullMQ)

```
Queue: file-processing
  parse-pdf          Extract text from PDF (pdfium / AWS Textract fallback)
  parse-dwg          Convert DWG → SVG → extract drawing metadata
  parse-xlsx         Parse BOQ spreadsheet → structured rows
  ocr-image          OCR on scanned documents

Queue: llm-generation
  analyze-tender     Parse files → extract risks, BOQ, deadlines, summary
  extract-boq        BOQ extraction on uploaded file set
  generate-proposal  Generate one proposal document (streams sections)
  generate-financial Cost analysis using pricing data
  scrape-pricing     Hit market APIs → update material_prices table
  generate-insights  Background: scan all active workspaces → surface AI insights
```

### 5.4 Proposal streaming (SSE)

```
1. Client:  POST /api/workspaces/:id/proposals  { type: "technical_proposal" }
2. Server:  Returns { jobId }
3. Client:  GET  /api/workspaces/:id/proposals/:jobId/stream  (SSE)
4. Server emits:
     { event: "section", data: { heading, body } }   ← one per section as written
     { event: "done",    data: { wordCount, tokens } }
     { event: "error",   data: { message } }
```

### 5.5 Copilot chat context

```
POST /api/copilot/chat  { workspaceId, message, history[] }

Context injected per call (cached blocks first):
  [cached] System prompt + role definition
  [cached] Company profile (all orgs share this cache key)
  [cached] Tender analysis for this workspace
  [cached] All ready proposals (refreshed every 5 min)
  [fresh]  User message + conversation history
```

### 5.6 Tender analysis prompt structure

```xml
[SYSTEM — ephemeral cached]
You are a UAE/GCC construction tender specialist with 20 years experience.
Extract structured data from tender documents. Return valid JSON only.

[USER block 1 — ephemeral cached: company profile]
<company_profile>
  Legal Name: ConstructCo LLC
  Certifications: ISO 9001:2015, DEWA Approved, RTA Grade A...
  Past Projects: [list with values and categories]
  Equipment: [list]
  Labour Capacity: [list]
</company_profile>

[USER block 2 — ephemeral cached: tender documents]
<tender_document name="conditions_of_contract.pdf">
  [full extracted text — up to 100k tokens]
</tender_document>
<tender_document name="boq.xlsx">
  [parsed table as CSV]
</tender_document>

[USER — not cached: task instruction]
Analyse this tender. Return JSON:
{
  "summary": "...",
  "requirements": [...],
  "risks": [{ "id", "title", "description", "level", "clause" }],
  "penalties": [...],
  "deadlines": [{ "label", "date" }],
  "boqItems": [{ "id", "description", "unit", "quantity", "unitPrice", "total", "category" }],
  "estimatedValue": 0,
  "complexity": "simple|moderate|complex|enterprise",
  "missingInfo": [...],
  "aiConfidence": 0.0
}
```

---

## 6. File Processing Pipeline

```
1. Client → pre-signed URL from Supabase Storage (direct upload — no server bandwidth)
2. Client → POST /api/workspaces/:id/files  { storagePath, name, type, size }
3. API    → INSERT workspace_files (processing_stage: "uploaded")
4. API    → Enqueue file-processing job (BullMQ)

5. Worker (Railway):
   a. Stage → "parsing"        Download file, run parser (PDF/DWG/XLSX/image)
   b. Stage → "extracting"     Run LLM BOQ extraction on parsed text
   c. Stage → "pricing"        Match BOQ items against material_prices table
   d. Stage → "ready"          Set ai_processed = true, INSERT boq_items + pricing_items

6. Supabase Realtime channel   → frontend receives stage updates live (no polling)
```

---

## 7. Auth & Multi-tenancy

- **Sign up** creates an `organisation` + `user` (role: `owner`) in a single transaction
- **Invite** sends a Resend email with a signed link; accepting creates the user in the same org
- **JWT** payload: `{ sub: userId, org_id, role }` — validated server-side on every request
- **RLS** on every table: `org_id = (auth.jwt() ->> 'org_id')::uuid`
- **Plan limits** enforced in API middleware — returns `403` with `{ error: "plan_limit", upgrade_url }` when exceeded

---

## 8. User Stories

### Epic 1 — Onboarding

| # | Story | Acceptance Criteria |
|---|---|---|
| U01 | As a new user I can sign up with email and create my organisation | Org + owner user created; redirected to company profile setup wizard |
| U02 | As an owner I can invite teammates by email | Resend invite email sent; clicking link creates user in same org |
| U03 | As a user I can complete my company profile (name, certs, projects, staff, equipment) | Profile saved to DB; reflects immediately in all generated proposals |
| U04 | As a user I can choose my market (UAE / Oman / Egypt / Saudi) | Market preference stored; currency and pricing data scoped accordingly |

### Epic 2 — Tender Management

| # | Story | Acceptance Criteria |
|---|---|---|
| T01 | As a user I can create a tender and upload files (PDF, DWG, XLSX) | Files uploaded to Storage; processing pipeline queued |
| T02 | I can see real-time file processing stages (Uploading → Parsing → Extracting → Ready) | Supabase Realtime pushes stage changes; frontend updates without reload |
| T03 | After upload, AI automatically extracts: summary, risks, deadlines, BOQ | `tender_analyses` row created with all fields populated |
| T04 | I can see risks rated by severity with clause references | Risks shown in Overview tab and sent to AI Insights |
| T05 | I can convert a tender into a project workspace to begin proposals | New workspace created; tender analysis data copied across |

### Epic 3 — BOQ & Pricing

| # | Story | Acceptance Criteria |
|---|---|---|
| B01 | I can view AI-extracted BOQ items in a table | Items shown with description, unit, qty, rate, total |
| B02 | I can add, edit, or delete BOQ items manually | Changes persisted; financial analysis auto-recalculated |
| B03 | I can trigger AI market pricing on my BOQ items | Pricing items matched and inserted; source and validity date shown |
| B04 | I can upload my own pricing sheet (XLSX) to override AI rates | File parsed; pricing_items created with `source: "uploaded"` |
| B05 | I can see variance between my rates and the original BOQ estimate | Variance % column highlighted red/green |

### Epic 4 — Proposal Generation

| # | Story | Acceptance Criteria |
|---|---|---|
| P01 | I can generate any of 9 proposal document types with one click | Job queued; sections stream to viewer in real time via SSE |
| P02 | All proposals are pre-filled with my company profile data | Company name, certs, staff, track record appear correctly |
| P03 | The Financial Proposal uses my actual priced BOQ rates | Total matches sum of qty × unit_price for all items |
| P04 | I can edit any generated section inline | Edit saved to `generated_proposals.sections` JSONB |
| P05 | I can export any proposal as PDF | Browser print dialog opens with formatted HTML |
| P06 | I can generate all proposals with one button | Queue runs sequentially; each completes before next starts |

### Epic 5 — Submission Tools

| # | Story | Acceptance Criteria |
|---|---|---|
| S01 | I have a submission checklist showing 14 required documents | Auto-linked proposals marked ready; physical docs manually ticked |
| S02 | The checklist shows a readiness percentage and progress bar | Score updated in real time as proposals are generated |
| S03 | I can write and generate a Method Statement | Form fields drive AI generation; output editable and exportable |
| S04 | I can view the construction programme as a Gantt chart | 21 activities shown with colour coding and critical path markers |
| S05 | I can generate a programme from BOQ data | AI maps BOQ activities to timeline; returns structured Gantt data |

### Epic 6 — AI Insights

| # | Story | Acceptance Criteria |
|---|---|---|
| I01 | I receive proactive AI alerts about risks in my active tenders | Insights generated by background job; shown in notification bell |
| I02 | I am alerted when a material price changes >5% affecting my open BOQs | Pricing alert insight created; linked to affected workspace |
| I03 | I can mark insights as read or dismiss them | `read` flag updated; dismissed removed from list |

### Epic 7 — Billing & Plans

| # | Story | Acceptance Criteria |
|---|---|---|
| BL01 | As a Starter user I can manage up to 3 active projects | API enforces limit; returns 403 with plan upgrade message |
| BL02 | I can upgrade my plan via Stripe Checkout | Stripe session created; webhook updates subscription table |
| BL03 | I can manage my billing via Stripe Customer Portal | Portal session created; user redirected |
| BL04 | Trial users see a countdown and upgrade CTA | `trial_ends_at` checked; banner shown with days remaining |

---

## 9. Plan Limits

| Feature | Starter | Pro | Business | Enterprise |
|---|---|---|---|---|
| Active projects | 3 | 25 | 100 | Unlimited |
| Users per org | 2 | 10 | 50 | Unlimited |
| File uploads / month | 20 | 200 | 1,000 | Unlimited |
| AI proposal generations / month | 10 | 100 | 500 | Unlimited |
| Company profile export themes | 2 | 4 | 4 | 4 |
| AI Insights | — | ✓ | ✓ | ✓ |
| Copilot chat | — | ✓ | ✓ | ✓ |
| API access | — | — | ✓ | ✓ |

---

## 10. Non-Functional Requirements

| Requirement | Target |
|---|---|
| API response time (p95) | < 300 ms |
| File upload + parse time | < 2 min for 20 MB PDF |
| LLM proposal generation time | < 45 sec per document |
| Uptime SLA | 99.5% monthly |
| Data residency | UAE preferred (Supabase ap-southeast-1 or dedicated) |
| Compliance | UAE PDPL — all PII encrypted at rest, deletable on request |
| LLM cost per workspace | Target < $0.15 (prompt caching reduces ~80%) |
| File storage cost | Supabase Storage $0.021/GB — negligible at v1 scale |

----

## 11. Phased Delivery

### Phase 1 — Core infrastructure (Weeks 1–6)
Supabase project + full schema + RLS policies · Auth (email/password + invite flow) · Company profile CRUD · File upload with Supabase Storage · Basic tender + workspace CRUD · Frontend wired to real API (replace Zustand mock store)

### Phase 2 — AI pipeline (Weeks 7–12)
BullMQ + Upstash Redis workers (Railway) · PDF/XLSX/DWG parsers · Claude tender analysis job · BOQ extraction · Proposal generation with SSE streaming · Prompt caching · LLM cost logging

### Phase 3 — Pricing & financial (Weeks 13–16)
Gulf construction market price scraping · Pricing sheet XLSX upload parser · Financial analysis generation · BOQ ↔ pricing variance calculation · Material price trend tracking

### Phase 4 — Billing & plan enforcement (Weeks 17–20)
Stripe Checkout + Customer Portal + webhooks · Plan limit middleware · Trial flow with countdown · Usage tracking dashboard

### Phase 5 — Polish & scale (Weeks 21–24)
AI Insights background job · Supabase Realtime file pipeline status · Rate limiting (Upstash) · Sentry + cost monitoring dashboards · Performance optimisation

---

## 12. Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Redis / BullMQ (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Email (Resend)
RESEND_API_KEY=

# AWS Textract (optional — complex DWG/scanned PDF extraction)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
```

---

## 13. Repository Structure (recommended)

```
/app
  /api                  Next.js Route Handlers
    /auth
    /org
    /tenders
    /workspaces
    /pricing
    /insights
    /copilot
    /billing
  /(app)                Frontend pages (existing)
/components             Frontend components (existing)
/lib
  /api                  API client helpers (frontend → API)
  /supabase             Supabase client + server utils
  /llm                  Claude API wrappers + prompt templates
  /parsers              PDF / XLSX / DWG parsers
  /queues               BullMQ job definitions
  /billing              Stripe helpers
/workers                BullMQ worker processes (deployed to Railway)
  file-processing.ts
  llm-generation.ts
/types                  Shared TypeScript types (existing)
/docs                   Architecture docs (this file)
/supabase
  /migrations           SQL migration files
  /seed.sql             Dev seed data
```
