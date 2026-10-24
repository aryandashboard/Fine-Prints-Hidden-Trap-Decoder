<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Fine Prints & Hidden Trap Decoder Operating Manual

## 1. Project Identity

- **Project Name:** Fine Prints & Hidden Trap Decoder
- **Verified Purpose:** A full-stack Next.js web application designed to help non-lawyer consumers, tenants, freelancers, and small business owners identify risky clauses, hidden monetary costs, and ambiguous terms in contracts, leases, and agreements before signing. It extracts text from PDFs, images (via OCR), or pasted text, submits it to an AI model, and renders a structured, color-coded "Safety Card" with red flag clauses, hidden fees, and clarifying negotiation scripts.
- **Current Implementation Status:** Functional MVP frontend and serverless API with simulated free scan limits (in-memory React state) and Stripe checkout scaffolding. AI analysis is 100% locally powered by Ollama (default `gemma3:1b`) with zero cloud API dependencies.
- **Actual Technology Stack:**
  - Runtime: Node.js (tested with v22.23.3, npm 10.9.9)
  - Framework: Next.js 16.3.4 (App Router, Node.js runtime for API routes)
  - UI Library: React 19.2.8 & React-DOM 19.2.8
  - Styling: Vanilla CSS Modules + CSS Custom Properties (`src/app/globals.css`, no Tailwind)
  - Icons: `lucide-react` (v1.41.0)
  - PDF Extraction: `pdf-parse` (v2.4.5, server-side via `new PDFParse({ data: buffer })`)
  - Image OCR: `tesseract.js` (v7.0.0, client-side dynamic import in browser)
  - AI Client: `openai` SDK (v7.10.0, configured exclusively for local Ollama `http://localhost:11434/v1` with zero external cloud calls)
  - Payment Processing: `stripe` (v22.6.1, server-side Stripe Checkout session generation); `@stripe/stripe-js` (v9.15.0, declared in `package.json` but currently unused)
  - Language & Tooling: TypeScript 5 (`tsconfig.json`), ESLint 9 (`eslint.config.mjs`)

---

## 2. Repository Map

```
Fine-Prints-Hidden-Trap-Decoder-main/
├── AGENTS.md                   # This operating manual for AI agents
├── ARCHITECTURE.md             # System architecture & Ollama migration design
├── PROJECT_AUDIT.md            # Comprehensive repository audit & verification baseline
├── CLAUDE.md                   # Agent pointer (@AGENTS.md)
├── README.md                   # Human-facing project overview and setup
├── eslint.config.mjs           # ESLint 9 flat configuration
├── next-env.d.ts               # Next.js TypeScript declarations
├── next.config.ts              # Next.js configuration with CSP headers
├── package.json                # Project dependencies and script declarations
├── package-lock.json           # Exact dependency lockfile
├── tsconfig.json               # TypeScript compiler options and path aliases (@/* -> ./src/*)
├── public/                     # Static SVG assets (file.svg, globe.svg, next.svg, etc.)
└── src/
    ├── app/
    │   ├── api/
    │   │   ├── analyze/
    │   │   │   └── route.ts    # POST: AI contract risk analysis endpoint
    │   │   ├── checkout/
    │   │   │   └── route.ts    # POST: Stripe subscription checkout session creator
    │   │   └── extract-pdf/
    │   │       └── route.ts    # POST: Server-side PDF text extraction via pdf-parse
    │   ├── cancel/
    │   │   └── page.tsx        # UI: Post-checkout cancellation landing page
    │   ├── favicon.ico         # App favicon
    │   ├── globals.css         # Global design tokens, dark mode media query, base styles
    │   ├── layout.tsx          # Root HTML layout and metadata
    │   ├── page.module.css     # CSS module for main scanner dashboard
    │   ├── page.tsx            # Main scanner page (upload, preview, analysis orchestration)
    │   ├── pricing/
    │   │   ├── page.module.css # CSS module for pricing comparison cards
    │   │   └── page.tsx        # UI: Pricing tiers (Free, Plus, Pro) with checkout triggers
    │   └── success/
    │       └── page.tsx        # UI: Post-checkout success landing page
    └── components/
        ├── SafetyCard.module.css # Styles for risk badges and Safety Card sections
        ├── SafetyCard.tsx        # Structured risk display with Copy and Print-to-PDF
        ├── TextPreview.module.css# Styles for text edit area and analysis controls
        ├── TextPreview.tsx       # Text review/edit component with character counter & limits
        ├── Uploader.module.css   # Styles for drag & drop zone and textarea
        └── Uploader.tsx          # Multi-input document loader (PDF, OCR, Paste, Sample)
```

### Major Module Responsibilities
- `src/app/page.tsx`: Central coordinator managing client state (`extractedText`, `isLoadingFile`, `isAnalyzing`, `analysisResult`, and `scansLeft`).
- `src/components/Uploader.tsx`: Ingestion portal. Dispatches PDFs to `/api/extract-pdf`, runs client-side `tesseract.js` for image OCR, or populates sample text.
- `src/components/TextPreview.tsx`: Intermediate editing sandbox enforcing a 25,000 character maximum prior to AI dispatch.
- `src/app/api/analyze/route.ts`: Core AI gateway. Enforces character validation, initializes AI SDK, injects legal review system prompt, triggers JSON completion, parses markdown/braced JSON, and sanitizes structure via `normalizeSafetyCard`.
- `src/components/SafetyCard.tsx`: Render target. Displays High/Medium/Low red flags, hidden costs, and negotiation questions with copy/print actions.
- `src/app/api/checkout/route.ts`: Stripe Checkout session initiator for Plus ($12/mo) and Pro ($29/mo) plans.

---

## 3. Architecture & Trust Boundaries

```
[Browser Client]
  │
  ├── 1. Upload PDF  ──> [POST /api/extract-pdf] ──> [pdf-parse] ──> Returns text
  ├── 2. Upload Image ─> [tesseract.js worker in browser] ───────> Local OCR
  ├── 3. Analyze Text ─> [POST /api/analyze] ────> [AI Engine] ──> Normalized Safety Card
  └── 4. Upgrade Plan ─> [POST /api/checkout] ───> [Stripe API] ─> Checkout Redirect URL
```

### Trust & Isolation Rules
- **AI Credentials:** All AI API keys (e.g. `OPENROUTER_API_KEY`) MUST remain on the server in Route Handlers. Never prefix AI credentials with `NEXT_PUBLIC_`.
- **Content Security Policy (CSP):** Configured in `next.config.ts`. Any new external endpoints called from the browser must be explicitly declared in `connect-src` or `frame-src`. Server-side calls from Route Handlers bypass browser CSP.
- **Port Conflict Caution:** Port 3000 may be in use by external processes on developer workstations (e.g., an independent test server at `C:\Users\Hp\local-ai-demo\server.js`). Next.js dev server will automatically attempt port 3001 if port 3000 is occupied.

---

## 4. Development Setup & Verification Commands

### Verified Prerequisites
- Node.js: `v20+` (tested on `v22.23.3`)
- Package Manager: `npm` (tested on `10.9.9`)
- Local AI Runtime (for Ollama): Ollama running on `http://localhost:11434` with model pulled (e.g., `ollama pull gemma3:1b` or `ollama pull qwen3:8b`).

### Startup Commands
```bash
# Navigate to the inner project directory where package.json lives:
cd Fine-Prints-Hidden-Trap-Decoder-main

# Install dependencies:
npm install

# Run development server:
npm run dev

# Run linting check:
npm run lint

# Build production bundle:
npm run build

# Start production server:
npm start
```

### Required Environment Variables (`.env.local`)
Create `.env.local` inside the directory containing `package.json`:
```env
# Application Host URL (Used for Stripe return URLs)
APP_URL=http://localhost:3000

# Local Ollama AI Provider (100% on-device, no cloud API keys needed)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:1b

# Stripe Integration (Optional for local AI testing)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 5. Coding Conventions

- **Next.js Version:** Next.js 16 App Router. Do not use legacy Pages Router patterns (`pages/`, `getStaticProps`, `getServerSideProps`).
- **React Components:** React 19 Client Components must start with `'use client';` directive. Keep client components focused on UI interactivity.
- **Styling:** Use Vanilla CSS Modules (`[Component].module.css`). Do NOT install or introduce Tailwind CSS unless explicitly requested by the user. Rely on variables defined in `src/app/globals.css` (`--primary`, `--danger`, `--warning`, `--surface`, `--background`, etc.).
- **Path Aliasing:** Use `@/*` which resolves to `./src/*` as defined in `tsconfig.json`.
- **Defensive Data Normalization:** Models (especially smaller local LLMs) can produce non-conforming JSON. All model responses MUST pass through sanitization/normalization functions (like `normalizeSafetyCard` in `src/app/api/analyze/route.ts`) with hard length clamps and type fallbacks.
- **Error Handling:** Route Handlers must wrap logic in `try/catch` blocks and return appropriate HTTP status codes (400 for client errors, 413 for payload size limits, 422 for unparseable input, 500 for backend/provider errors) with JSON payloads `{ error: string }`.

---

## 6. AI Integration Rules & Ollama Principles

1. **Own the AI Layer on the Server:** All AI interactions originate in the server Route Handler (`src/app/api/analyze/route.ts`). Never make direct AI calls from browser components.
2. **Preserve System Prompts & Safety Guardrails:** The core system prompt instructs the AI to:
   - Identify risks in plain English without providing unauthorized legal advice.
   - Refrain from telling users whether to sign.
   - Avoid rewriting the entire contract.
   - Output structured JSON matching `{ redFlags, hiddenCosts, askScript }`.
3. **Handle Local Model Limitations Gracefully:**
   - Small models like `gemma3:1b` (806MB) may return string arrays instead of deep nested object arrays.
   - Defensive parsing in `normalizeSafetyCard` handles both plain string items and structured objects seamlessly.
   - Timeout and latency handling accommodates CPU inference delays (60-second timeout).
4. **Local Only Architecture:** The application exclusively interfaces with local Ollama at `http://localhost:11434/v1`. No data is dispatched to cloud AI providers.

---

## 7. Mandatory Agent Behavior

1. **Inspect Before Acting:** Read actual files and line numbers before claiming functionality exists or modifying code.
2. **No Speculative Changes:** Do not rename files, refactor working logic, or delete code unless explicitly requested by the user.
3. **Preserve Secrets:** Never commit, log, or display API keys, tokens, or credential strings.
4. **Preserve Integrity:** Never claim tests or builds passed unless you actually executed the command and inspected the output.
5. **No Migration Execution Without Approval:** Do not implement source code migrations until the user explicitly reviews the plan and gives authorization.
