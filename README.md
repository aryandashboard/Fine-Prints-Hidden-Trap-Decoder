# Fine Prints & Hidden Trap Decoder

A web application that helps users understand risky clauses in contracts, PDFs, screenshots, photos, and pasted legal text. It uses **100% local AI via Ollama** to produce a simple, private "Safety Card" that summarizes potential risks before signing—with zero cloud API dependencies.

## Features

- **Upload Anything:** Supports PDF documents, images (PNG, JPG) for OCR, and direct copy-pasting of text.
- **100% Local & Private AI:** Runs completely on your local machine using Ollama (e.g., `gemma3:1b` or `qwen3:8b`). No document text or sensitive legal data ever leaves your computer.
- **Safety Card:** Generates three structured sections:
  - 🚩 **Red Flag Clauses**: Where you might give away rights.
  - 💰 **Hidden Money Costs**: Penalties, delay fees, etc.
  - 💬 **Ask Before Signing Script**: Diplomatic questions to negotiate or clarify.

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- React
- Vanilla CSS Modules (Dark mode UI)
- `pdf-parse` (Server-side PDF extraction)
- `tesseract.js` (Client-side Image OCR)
- `openai` SDK (targets Ollama's local `http://localhost:11434/v1` endpoint)

## Getting Started

1. **Install and run Ollama:**
   - Download from [ollama.com](https://ollama.com/).
   - Ensure Ollama is running (`ollama serve`).
   - Pull your preferred model:
     ```bash
     ollama pull gemma3:1b
     ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env.local` file:
   ```env
   # Local Ollama Configuration
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=gemma3:1b

   # Application URL
   APP_URL=http://localhost:3000
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Disclaimer
This is an AI-assisted summary tool and does not provide legal advice. Always consult a qualified professional for legal counsel.
