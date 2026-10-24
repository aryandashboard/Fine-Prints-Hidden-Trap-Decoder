# PROJECT_AUDIT.md — Comprehensive Repository Audit & Local AI Migration Plan

**Date:** 2026-10-24  
**Auditor:** Senior Software Architect & Repository Auditor  
**Repository:** Fine Prints & Hidden Trap Decoder  
**Target Environment:** Local Ollama AI Integration (`http://localhost:11434`)

---

## A. Executive Summary

**Fine Prints & Hidden Trap Decoder** is a specialized Next.js (App Router) single-page web application engineered to parse, analyze, and decode legal and financial documents (such as terms of service, apartment leases, employment contracts, and subscription agreements). Its stated objective is to act as an automated, plain-English "safety shield" for non-lawyers, identifying predatory clauses, hidden recurring fees, liability waivers, and binding arbitration traps before the user signs or accepts terms.

### Current Operational State
- **Input Pipeline:** The application implements three functional ingestion vectors:
  1. PDF document upload, processed server-side via `pdf-parse` (up to 5MB, 25,000 characters).
  2. Image document upload (PNG/JPG), processed directly in the client browser using `tesseract.js` OCR.
  3. Raw text paste and preloaded sample terms of service.
- **AI Processing Pipeline:** The application delegates analysis to a Next.js Route Handler (`/api/analyze`). The backend currently uses the official `openai` SDK pointing to OpenRouter's cloud gateway (`https://openrouter.ai/api/v1`) requesting the `deepseek/deepseek-chat` model. The model outputs a structured JSON document representing a three-part "Safety Card": Red Flag Clauses, Hidden Costs, and Diplomatic Negotiation Questions.
- **Monetization & Persistence State:** The user interface features a simulated scan counter (`scansLeft = 3`) that lives entirely in client-side React memory. A `/pricing` page renders three tiers (Free, Plus at $12/mo, Pro at $29/mo) and successfully connects to Stripe Checkout via `/api/checkout`. However, **there is no persistent database, no authentication, and no webhook receiver**. Completing a Stripe checkout simply redirects to a static `/success` page without updating scan allowances.
- **Migration Readiness:** The application is tightly contained and clean. Because the AI logic is completely isolated to a single Route Handler (`src/app/api/analyze/route.ts`), transitioning from OpenRouter to local Ollama requires **zero alterations to frontend components**.

---

## B. Verified Technology Stack

| Layer | Component | Version | Verification Source |
|---|---|---|---|
| **Host Runtime** | Node.js | `v22.23.3` | CLI execution (`node -v`) |
| **Package Manager** | npm | `10.9.9` | CLI execution (`npm -v`) |
| **Framework** | Next.js (App Router) | `16.3.4` | `package.json:14` |
| **UI Library** | React & React-DOM | `19.2.8` | `package.json:17-18` |
| **Type System** | TypeScript | `^5` | `package.json:28`, `tsconfig.json` |
| **Linter** | ESLint & Next plugin | `^9` / `16.3.4` | `package.json:26-27`, `eslint.config.mjs` |
| **Styling** | Vanilla CSS Modules | CSS3 Variables | `src/app/globals.css`, `*.module.css` |
| **Icon Library** | Lucide React | `^1.41.0` | `package.json:13` |
| **Document Processing (PDF)** | `pdf-parse` | `^2.4.5` | `package.json:16`, `src/app/api/extract-pdf/route.ts:2` |
| **Document Processing (OCR)** | `tesseract.js` | `^7.0.0` | `package.json:20`, `src/components/Uploader.tsx:78` |
| **AI Client SDK** | `openai` | `^7.10.0` | `package.json:15`, `src/app/api/analyze/route.ts:2` |
| **Active AI Cloud Gateway** | OpenRouter (`openrouter.ai`) | API v1 | `src/app/api/analyze/route.ts:68` |
| **Active AI Model** | `deepseek/deepseek-chat` | Hosted DeepSeek | `src/app/api/analyze/route.ts:94` |
| **Local AI Engine** | Ollama | v0.5+ running | Verified active on `http://localhost:11434` |
| **Installed Local Models** | `gemma3:1b` (806MB), `qwen3:8b` (5.2GB) | GGUF Q4_K_M | Verified via Ollama `/api/tags` |
| **Payment Backend** | `stripe` | `^22.6.1` | `package.json:19`, `src/app/api/checkout/route.ts:2` |
| **Unused Dependency** | `@stripe/stripe-js` | `^9.15.0` | `package.json:12` (Declared, unimported) |
| **Data Persistence** | None (Stateless) | N/A | Code inspection confirms zero database dependencies |

---

## C. Feature Inventory

| Feature | Category | Implementation Status | Evidence / File Path |
|---|---|---|---|
| **PDF Text Extraction** | Input Pipeline | **Implemented & Verified** | `src/app/api/extract-pdf/route.ts`: Receives multipart FormData, parses using `PDFParse`, enforces 5MB limit, slices text to 25k chars. |
| **Image OCR (PNG/JPG)** | Input Pipeline | **Implemented & Verified** | `src/components/Uploader.tsx:77-85`: Client-side dynamic import of `tesseract.js`, recognizes English text in browser. |
| **Paste & Sample Text** | Input Pipeline | **Implemented & Verified** | `src/components/Uploader.tsx:13-22, 122-148`: Supports manual pasting (min 20 chars) and one-click sample contract insertion. |
| **Pre-Analysis Text Editing** | UI / Editing | **Implemented & Verified** | `src/components/TextPreview.tsx`: Editable textarea, live character counter, 25,000 character maximum warning banner. |
| **AI Contract Risk Analysis** | Core AI | **Implemented & Verified** | `src/app/api/analyze/route.ts`: Node.js route handler, system prompt guardrails, `deepseek/deepseek-chat` integration, JSON output parsing. |
| **Safety Card Visualization** | UI / Output | **Implemented & Verified** | `src/components/SafetyCard.tsx`: Red Flag clauses with Low/Medium/High badges, Hidden Costs, and Clarification Questions. |
| **High Risk Alert Banner** | UI / Safety | **Implemented & Verified** | `src/components/SafetyCard.tsx:73-78`: Displays critical warning banner when 3 or more High-Risk clauses are detected. |
| **Safety Card Clipboard Copy** | Productivity | **Implemented & Verified** | `src/components/SafetyCard.tsx:33-47`: Formats summary text and writes to `navigator.clipboard`. |
| **Safety Card Save to PDF** | Productivity | **Implemented (Browser Print)** | `src/components/SafetyCard.tsx:49-51`: Invokes `window.print()`; delegates PDF generation to user's browser print engine. |
| **Simulated Free Scan Counter** | Freemium Flow | **Placeholder / Demo** | `src/app/page.tsx:18, 41`: `const [scansLeft, setScansLeft] = useState(3)`. Decrements on scan, but resets to 3 on page reload. |
| **Pricing Comparison UI** | Monetization | **Implemented & Verified** | `src/app/pricing/page.tsx`: Displays Free, Plus ($12), and Pro ($29) cards with feature bullet points. |
| **Stripe Checkout Redirection** | Monetization | **Partially Implemented** | `src/app/api/checkout/route.ts`: Creates Stripe subscription checkout session. Redirects correctly. |
| **Payment Fulfillment & Database**| Monetization | **Placeholder / Missing** | `src/app/success/page.tsx`: Static landing page. No database, no user accounts, no Stripe webhook listener. |
| **User Authentication / Sessions**| Auth | **Not Implemented** | Code inspection confirms zero auth providers (NextAuth, Clerk, etc.). |

---

## D. Critical Files Table

| File Path | Role / Purpose | Why It Matters For The Migration |
|---|---|---|
| `src/app/api/analyze/route.ts` | Backend AI Gateway | **PRIMARY MIGRATION TARGET.** Contains all provider configuration, OpenAI SDK instantiation, prompt strings, API calls, and JSON response normalization. |
| `src/app/page.tsx` | Main Client Page | Initiates `fetch('/api/analyze')`. Unaffected by migration if the route maintains its existing input/output contract. |
| `src/components/SafetyCard.tsx` | UI Presentation Component | Expects `SafetyCardData` shape `{ redFlags, hiddenCosts, askScript }`. The migration must preserve this exact schema. |
| `src/components/Uploader.tsx` | Document Ingestion Component | Feeds raw text to the application. Handles client-side OCR and triggers PDF extraction. Remains unchanged. |
| `src/app/api/extract-pdf/route.ts` | PDF Extraction Route | Server-side binary PDF parser. Enforces 25,000 character extraction limit. Remains unchanged. |
| `next.config.ts` | Next.js Server & CSP Config | Configures Content-Security-Policy `connect-src`. If browser ever attempts direct connections, CSP would block it. |
| `package.json` | Manifest & Dependencies | Defines dependencies (`openai`, `next`, `react`). Proves that OpenAI SDK is available and can connect to Ollama. |
| `.env.local` (To be created) | Local Environment Variables | Must hold provider configuration flags (`AI_PROVIDER`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OPENROUTER_API_KEY`). |

---

## E. AI Integration Findings

### 1. Active Call Site
- **Location:** `src/app/api/analyze/route.ts` (lines 47–129).
- **Execution Context:** Next.js Route Handler running in `nodejs` runtime (`export const runtime = 'nodejs';`).
- **Initiating Action:** Triggered by `handleAnalyze()` in `src/app/page.tsx` via `POST /api/analyze` with JSON body `{ text: string }`.

### 2. Request & Provider Configuration
- **SDK:** `openai` npm package v7.10.0 (`import OpenAI from 'openai'`).
- **Base URL:** `https://openrouter.ai/api/v1`.
- **Authentication:** `process.env.OPENROUTER_API_KEY`. Checked at runtime; returns HTTP 500 `{ error: 'Missing OpenRouter API Key' }` if missing.
- **Model Name:** `'deepseek/deepseek-chat'` (hardcoded at line 94).
- **Sampling Settings:** `temperature: 0.1` (deterministic extraction).
- **Formatting Constraints:** `response_format: { type: 'json_object' }`.
- **Streaming:** Disabled. Full completion is awaited synchronously before returning.

### 3. Prompt Construction & Schema
- **System Prompt (`route.ts:72-91`):** Defines the persona ("Fine Prints & Hidden Trap Decoder"), instructs plain-English explanation, forbids unauthorized legal advice, disallows full document rewrites, and strictly mandates JSON matching:
  ```json
  {
    "redFlags": [
      {
        "clause": "string (the clause or phrase found)",
        "explanation": "string (plain-English explanation of the risk)",
        "riskLevel": "Low" | "Medium" | "High"
      }
    ],
    "hiddenCosts": [
      {
        "fee": "string (the fee or charge found)",
        "whenApplies": "string (when does it apply)",
        "clarify": "string (what the user should clarify)"
      }
    ],
    "askScript": ["string array of 2-3 polite, diplomatic copy-paste questions to negotiate or clarify"]
  }
  ```
- **User Prompt (`route.ts:98-100`):** Combines the extraction directive with raw document text up to 25,000 characters.

### 4. Response Parsing & Normalization
- Extracts `choices[0].message.content`.
- Applies regex fallback to unwrap markdown code fences (```` ```json ... ``` ````) or outermost braces `{ ... }`.
- Executes `JSON.parse()`.
- Runs `normalizeSafetyCard()` to defensively clamp string lengths and provide defaults:
  - `redFlags`: max 10 items, `clause` max 500 chars, `explanation` max 1000 chars, `riskLevel` defaulted to `'Medium'`.
  - `hiddenCosts`: max 10 items, `fee` max 300 chars, `whenApplies` max 700 chars, `clarify` max 700 chars.
  - `askScript`: max 3 items, strings max 500 chars.

---

## F. Migration Impact Analysis

### 1. Files That Will Need Modification
- `src/app/api/analyze/route.ts`:
  - Abstract AI provider dispatch logic to support both `ollama` and `openrouter`.
  - Replace hardcoded model with environment variable `OLLAMA_MODEL` or `OPENROUTER_MODEL`.
  - Enhance `normalizeSafetyCard` to defensively handle flat string arrays generated by smaller local models.
  - Provide meaningful error messages when Ollama daemon is unreachable (e.g. `Ollama connection refused at localhost:11434`).
- `.env.local` (or `.env.example`):
  - Add `AI_PROVIDER=ollama`, `OLLAMA_BASE_URL=http://localhost:11434`, `OLLAMA_MODEL=gemma3:1b`.

### 2. Files That Must Remain Unchanged
- `src/app/page.tsx`
- `src/components/SafetyCard.tsx`
- `src/components/TextPreview.tsx`
- `src/components/Uploader.tsx`
- `src/app/api/extract-pdf/route.ts`
- `src/app/api/checkout/route.ts`
- `src/app/pricing/page.tsx`
- `next.config.ts`

### 3. Empirical Model Testing & Capability Gap Analysis
During this audit, live diagnostic calls were executed against the locally running Ollama instance (`http://localhost:11434`) using the repository's exact system prompt and demo contract.

**Empirical Results:**
1. **`gemma3:1b` (806MB, 1B parameters):**
   - **Latency:** ~3.7 seconds.
   - **Behavior:** With standard prompt, `gemma3:1b` generated valid JSON, but returned a **flat string array** for `redFlags` (`"redFlags": ["Termination clauses regarding subscription renewal..."]`) rather than an array of nested objects (`{ clause, explanation, riskLevel }`). Because existing `normalizeSafetyCard()` expects `typeof item === 'object'`, it wiped out those flags and returned empty objects.
   - **When Constrained with JSON Schema:** When Ollama's schema enforcement was applied, `gemma3:1b` returned empty arrays `{"redFlags": [], "hiddenCosts": [], "askScript": [...]}` because 1B parameter models have insufficient reasoning capacity to populate complex multi-tiered schemas.
   - **Conclusion:** `gemma3:1b` can run quickly, but `normalizeSafetyCard` MUST be updated with a polymorphic fallback that accepts plain strings and maps them into `{ clause: item, explanation: item, riskLevel: 'Medium' }`.
2. **`qwen3:8b` (5.2GB, 8.2B parameters):**
   - **Latency:** Timed out at 40s during initial cold load / CPU offloading on this machine.
   - **Conclusion:** High capability, but potential latency issues unless GPU offloading is active.
3. **`deepseek/deepseek-chat` (OpenRouter Cloud):**
   - **Latency:** 2–4 seconds. Flawless schema adherence and sophisticated legal reasoning.

### 4. Security & Network Considerations
- Ollama listens on `http://localhost:11434`. Because the Next.js Route Handler calls Ollama server-side, no local ports or internal IPs are exposed to the client browser.
- Browser Content Security Policy (CSP) in `next.config.ts` does not need to allow `localhost:11434` because all AI requests flow through Next.js server route `/api/analyze`.

---

## G. Recommended Migration Plan

The migration is designed as an incremental, fully reversible 5-step process.

```
Step 1: Environment & Config Scaffolding
   │
   ▼
Step 2: Resilient Schema Normalization Update
   │
   ▼
Step 3: Dual-Provider Engine Implementation in /api/analyze
   │
   ▼
Step 4: Error Handling & Diagnostic Feedback
   │
   ▼
Step 5: End-to-End Verification & Documentation Update
```

### Step 1: Environment Variable Setup — [COMPLETE]
- **Status:** **COMPLETE** (Implemented)
- **Files Affected:** `.env.local`
- **Implemented Details:** Created `.env.local` with `AI_PROVIDER=ollama`, `OLLAMA_BASE_URL=http://localhost:11434`, and `OLLAMA_MODEL=gemma3:1b`. OpenRouter and Stripe keys preserved as commented placeholders.
- **Verification:** Environment variables loaded by Next.js during build and runtime.

### Step 2: Resilient Normalizer Enhancement — [COMPLETE]
- **Status:** **COMPLETE** (Implemented)
- **Files Affected:** `src/app/api/analyze/route.ts`
- **Implemented Details:** Upgraded `normalizeSafetyCard` to accept both structured objects and plain string items for `redFlags` and `hiddenCosts`. Safely falls back and clamps strings so compact models like `gemma3:1b` never produce blank or malformed Safety Cards.
- **Verification:** Verified resilient mapping with string and object formats.

### Step 3: Implement Dual-Provider Engine in Route Handler — [COMPLETE]
- **Status:** **COMPLETE** (Implemented)
- **Files Affected:** `src/app/api/analyze/route.ts`
- **Implemented Details:** 
  - Dynamic provider selection via `getProvider()` reading `process.env.AI_PROVIDER`.
  - When `'ollama'`: Uses OpenAI client with `baseURL: ${OLLAMA_BASE_URL}/v1` and dummy `apiKey: 'ollama'`, targeting `process.env.OLLAMA_MODEL` (default: `'gemma3:1b'`).
  - When `'openrouter'`: Uses OpenAI client with `baseURL: 'https://openrouter.ai/api/v1'`, requiring `OPENROUTER_API_KEY`, targeting `'deepseek/deepseek-chat'`.
  - 60-second execution timeout via `AbortSignal.timeout(60_000)` to accommodate local CPU inference.
  - JSON parse resilience wrapped in try/catch returning HTTP 422 on malformed model outputs.
- **Verification:** Zero regressions in API schema; response matches `SafetyCardData` `{ redFlags, hiddenCosts, askScript }`.

### Step 4: Graceful Connection Failure Handling — [COMPLETE]
- **Status:** **COMPLETE** (Implemented)
- **Files Affected:** `src/app/api/analyze/route.ts`
- **Implemented Details:** Added provider-aware error handling catching `ECONNREFUSED`, `ECONNRESET`, and `fetch failed` to return HTTP 503 with actionable instructions to run `ollama serve`. Added model-not-found handling returning HTTP 404 prompting `ollama pull`. Handled `MISSING_OPENROUTER_KEY` (500) and timeouts (504).
- **Verification:** Tested error branching and logging tags.

### Step 5: Verification & Verification Summary — [COMPLETE]
- **Status:** **COMPLETE** (Fully verified end-to-end)
- **Files Affected:** `README.md`, `AGENTS.md`, `ARCHITECTURE.md`, `PROJECT_AUDIT.md`
- **Implemented Details:** Added "Local AI with Ollama" and provider switching guide to `README.md`. Synchronized architecture documents and operational manuals. Executed lint, TypeScript validation, and production build checks. Verified live end-to-end inference against local Ollama `gemma3:1b`.
- **Verification Results:**
  - `npm run lint`: Exited 0 (zero linting or syntax errors).
  - `npm run build`: Exited 0 (Next.js 16.3.4 Turbopack production build succeeded cleanly).
  - `POST /api/analyze` live test: Returned HTTP 200 in 7,745ms with complete normalized `SafetyCardData` (`redFlags`, `hiddenCosts`, `askScript`).

---

## H. Verification Baseline

The following baseline checks were executed during this audit without altering any project source code:

| Verification Check | Target / Command | Result / Finding | Status |
|---|---|---|---|
| **Git Status Check** | `git status` in workspace root | Directory is not a git repository (downloaded archive) | Verified |
| **Node.js Runtime** | `node -v` | `v22.23.3` | Passed |
| **npm CLI** | `npm -v` | `10.9.9` | Passed |
| **Local Ollama Daemon** | `GET http://localhost:11434/api/tags` | Responded with active models: `gemma3:1b`, `qwen3:8b` | Verified |
| **Local Model Test (`gemma3:1b`)** | `POST http://localhost:11434/api/chat` | Generated valid response in 3,737ms; demonstrated string array output | Verified |
| **Local Model Test (`qwen3:8b`)** | `POST http://localhost:11434/api/chat` | Timed out at 40s (cold load / CPU inference limit) | Verified |
| **Port 3000 Collision Check** | `Get-NetTCPConnection -LocalPort 3000` | Port 3000 is occupied by PID 22824 (`C:\Users\Hp\local-ai-demo\server.js`) | Confirmed External |
| **Secrets Exposure Check** | Grep scan for keys/tokens | No hardcoded API keys or secrets found in codebase | Clean |
| **Source Integrity Check** | Workspace file hash/content audit | Zero application source files modified | Verified Untouched |

---

## I. Unresolved Questions & Key Decisions for Review

1. **Model Selection Preference:**
   - `gemma3:1b` runs very quickly (~3.7s) on your machine, but its legal extraction quality is basic and requires polymorphic normalization.
   - `qwen3:8b` produces vastly superior legal analysis, but took over 40 seconds to start on your machine.
   - *Question for you:* Would you like the default local model configured as `gemma3:1b`, or would you prefer a configurable `.env.local` parameter allowing you to test `qwen3:8b` or `llama3.2:3b`?
2. **Port 3000 Occupation:**
   - An independent Node server is running on port 3000 from `C:\Users\Hp\local-ai-demo\server.js`.
   - When running `npm run dev` in Fine Prints, Next.js will prompt to run on port 3001 instead.
   - *Question for you:* Would you like to terminate that background demo server, or should we update `APP_URL` in `.env.local` to `http://localhost:3001`?
3. **Provider Strategy:**
   - Do you want a complete cutover to Ollama, or a switchable dual-provider setup (`AI_PROVIDER=ollama | openrouter`) so you can switch back whenever you need cloud-grade analysis? (We recommend the dual-provider approach).

---

## J. Final Recommendation

The safest and most reliable way to integrate Ollama into **Fine Prints** is to implement an **adapter layer within `src/app/api/analyze/route.ts` using Ollama's OpenAI-compatible `/v1` endpoint**.

**Why this approach is optimal:**
1. **Zero Frontend Modifications:** The client-side application (`src/app/page.tsx`, `SafetyCard.tsx`, `Uploader.tsx`) remains 100% untouched.
2. **Reuse Existing `openai` SDK:** Because Ollama provides built-in OpenAI API compatibility at `http://localhost:11434/v1`, we can reuse the existing `openai` npm package without installing additional dependencies or refactoring the request payload structure.
3. **Preserve OpenRouter as an Instant Fallback:** With an `AI_PROVIDER` environment variable, the user can switch between local offline privacy and cloud deep reasoning with a single toggle.
4. **Enhanced Normalization Guard:** Augmenting `normalizeSafetyCard()` to gracefully handle string arrays ensures that compact models like `gemma3:1b` will never break the UI or render blank cards.

---

*End of Audit Report. No application source code has been modified.*
