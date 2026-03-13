type OpenAIChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OpenAIChatRequest = {
  model: string;
  messages: OpenAIChatMessage[];
  temperature: number;
  max_completion_tokens: number;
};

type OpenAIChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-5.2";
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_MAX_COMPLETION_TOKENS = 1800;
const DEFAULT_TIMEOUT_MS = 20000;

export const generate = async (prompt: string): Promise<string> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const systemMessage: OpenAIChatMessage = {
      role: "system",
      content:
        "Ti si profesionalni lektor i korektor za crnogorski, srpski i hrvatski jezik.\nStrogo poštuješ zadate instrukcije.\nNikada ne dodaješ objašnjenja, uvod, zaključak niti metatekst.\nVraćaš isključivo traženi rezultat.",
    };

    // The model should return only the edited final text (no inline marking).
    const userMessage: OpenAIChatMessage = {
      role: "user",
      content: prompt,
    };

    const body: OpenAIChatRequest = {
      model: DEFAULT_MODEL,
      temperature: DEFAULT_TEMPERATURE,
      max_completion_tokens: DEFAULT_MAX_COMPLETION_TOKENS,
      messages: [systemMessage, userMessage],
    };

    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const payload = (await response.json()) as OpenAIChatResponse;

    if (!response.ok || payload.error) {
      const errorMessage = payload.error?.message || "OpenAI API error";
      console.error("[LLM] OpenAI error", {
        status: response.status,
        message: errorMessage,
      });
      throw new Error(errorMessage);
    }

    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      console.error("[LLM] Empty response content", {
        status: response.status,
      });
      throw new Error("Empty response from OpenAI");
    }

    return content;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[LLM] Request timed out");
      throw new Error("OpenAI request timed out");
    }
    console.error("[LLM] Request failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    throw error instanceof Error ? error : new Error("OpenAI request failed");
  } finally {
    clearTimeout(timeoutId);
  }
};
