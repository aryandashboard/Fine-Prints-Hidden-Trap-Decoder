import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const MAX_TEXT_LENGTH = 25000;

// ---------------------------------------------------------------------------
// Local Ollama configuration (server-side only)
// ---------------------------------------------------------------------------

function getOllamaClient(): { client: OpenAI; model: string; baseURL: string } {
  const baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'gemma3:1b';

  return {
    client: new OpenAI({
      baseURL: `${baseURL}/v1`,
      apiKey: 'ollama', // Ollama local API does not require an API key
    }),
    model,
    baseURL,
  };
}

// ---------------------------------------------------------------------------
// Safety Card normalisation – handles both object arrays AND raw strings
// ---------------------------------------------------------------------------

type RiskLevel = 'Low' | 'Medium' | 'High';

function asString(value: unknown, maxLength = 1000): string {
  return typeof value === 'string' ? value.slice(0, maxLength) : '';
}

function asRiskLevel(value: unknown): RiskLevel {
  return value === 'Low' || value === 'Medium' || value === 'High' ? value : 'Medium';
}

function normalizeSafetyCard(value: unknown) {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const redFlags = Array.isArray(source.redFlags) ? source.redFlags : [];
  const hiddenCosts = Array.isArray(source.hiddenCosts) ? source.hiddenCosts : [];
  const askScript = Array.isArray(source.askScript) ? source.askScript : [];

  return {
    redFlags: redFlags.slice(0, 10).map((item) => {
      // Small models (e.g. gemma3:1b) may return plain strings instead of objects
      if (typeof item === 'string') {
        return {
          clause: item.slice(0, 500),
          explanation: item.slice(0, 1000),
          riskLevel: 'Medium' as RiskLevel,
        };
      }

      const flag = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};

      return {
        clause: asString(flag.clause, 500),
        explanation: asString(flag.explanation, 1000),
        riskLevel: asRiskLevel(flag.riskLevel),
      };
    }),
    hiddenCosts: hiddenCosts.slice(0, 10).map((item) => {
      // Small models may return plain strings instead of objects
      if (typeof item === 'string') {
        return {
          fee: item.slice(0, 300),
          whenApplies: '',
          clarify: item.slice(0, 700),
        };
      }

      const cost = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};

      return {
        fee: asString(cost.fee, 300),
        whenApplies: asString(cost.whenApplies, 700),
        clarify: asString(cost.clarify, 700),
      };
    }),
    askScript: askScript.slice(0, 3).map((item) => asString(item, 500)).filter(Boolean),
  };
}

// ---------------------------------------------------------------------------
// Shared prompt (identical for all providers)
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are Fine Prints & Hidden Trap Decoder, an assistant that reviews contracts, policies, leases, service agreements, purchase terms, employment documents, subscriptions, and other legal or financial text. Your job is to identify potential risks in plain English. You are not a lawyer and must not provide legal advice. Do not tell the user whether to sign. Do not rewrite the whole document. Do not produce a long essay. Output only a structured Safety Card with three sections: Red Flag Clauses, Hidden Money Costs, and Ask Before Signing Script. Be concise, practical, and cautious. Quote or reference the relevant clause briefly when possible. If the text is incomplete, blurry, contradictory, or ambiguous, say that clearly. Use user-friendly language suitable for non-lawyers.

Output your response ONLY in valid JSON format matching this exact schema:
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
}`;

// ---------------------------------------------------------------------------
// JSON extraction helpers
// ---------------------------------------------------------------------------

function extractJSON(content: string): string {
  // Try markdown code-fence first
  const jsonMatch = content.match(/```(?:json)?\n([\s\S]*?)\n```/);
  if (jsonMatch) return jsonMatch[1];

  // Fall back to outermost braces
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    return content.substring(firstBrace, lastBrace + 1);
  }

  return content;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { text?: unknown } | null;
    const text = typeof body?.text === 'string' ? body.text.trim() : '';

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text is too long. Please keep it under ${MAX_TEXT_LENGTH.toLocaleString()} characters.` },
        { status: 413 }
      );
    }

    const { client, model } = getOllamaClient();

    const completion = await client.chat.completions.create(
      {
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Analyze the following text and extract the safety card information in JSON format:\n\n${text}`,
          },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      },
      {
        // 60 s timeout – accommodates local CPU inference
        signal: AbortSignal.timeout(60_000),
      },
    );

    const content = completion.choices[0].message.content || '';

    // Extract and parse JSON from model output
    const jsonStr = extractJSON(content);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error('[ollama] Failed to parse model JSON output:', jsonStr.slice(0, 500));
      return NextResponse.json(
        { error: 'Local AI returned unparseable output. Please try again or shorten your text.' },
        { status: 422 },
      );
    }

    const result = normalizeSafetyCard(parsed);

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown analysis error';
    const code = (error as NodeJS.ErrnoException)?.code;
    const baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const model = process.env.OLLAMA_MODEL || 'gemma3:1b';

    // Ollama connection errors
    if (code === 'ECONNREFUSED' || code === 'ECONNRESET' || message.includes('fetch failed')) {
      console.error(`[ollama] Connection refused at ${baseURL}:`, message);
      return NextResponse.json(
        { error: `Cannot connect to local Ollama at ${baseURL}. Please ensure Ollama is running (ollama serve).` },
        { status: 503 },
      );
    }

    // Model not found (Ollama returns 404 or error containing 'not found')
    const errorStatus = (error as { status?: number })?.status;
    if (errorStatus === 404 || message.toLowerCase().includes('not found')) {
      console.error(`[ollama] Model not found:`, message);
      return NextResponse.json(
        { error: `Model "${model}" not found in local Ollama. Please run "ollama pull ${model}" to install it.` },
        { status: 404 },
      );
    }

    // Timeout
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      console.error('[ollama] Request timed out after 60 s');
      return NextResponse.json(
        { error: 'Local AI analysis timed out. The model may still be loading into memory — please try again in a moment.' },
        { status: 504 },
      );
    }

    console.error('[ollama] API Error:', message);
    return NextResponse.json({ error: 'Failed to analyze text with local AI' }, { status: 500 });
  }
}
