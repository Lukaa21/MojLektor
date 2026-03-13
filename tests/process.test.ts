import type { NextApiRequest, NextApiResponse } from "next";
import { describe, expect, it, vi } from "vitest";
import handler from "../src/pages/api/process";
import { AIProcessor } from "../src/ai/processor";
import { generate } from "../src/ai/llmAdapter";
import { JobStatus, ServiceType, type Job } from "../src/core/models";

vi.mock("../src/ai/llmAdapter", () => ({
  generate: vi.fn(async (prompt: string) => prompt),
}));

vi.mock("../src/middleware/rateLimit", () => ({
  processRateLimit: vi.fn(async () => true),
}));

vi.mock("../src/auth/guards", () => ({
  requireNextAuthUser: vi.fn(async () => ({
    id: "test-user",
    email: "test@test.com",
    tokenBalance: 1000000,
  })),
}));

vi.mock("../src/tokens/service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/tokens/service")>();
  return {
    ...actual,
    consumeTokensForProcessing: vi.fn(async () => ({ ok: true, remaining: 999000 })),
  };
});

const createMockRes = () => {
  let statusCode = 200;
  let jsonBody: unknown = null;

  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(body: unknown) {
      jsonBody = body;
      return res;
    },
    setHeader() {
      return res;
    },
  } as unknown as NextApiResponse;

  return {
    res,
    getStatus: () => statusCode,
    getJson: () => jsonBody,
  };
};

const callHandler = async (body: Record<string, unknown>) => {
  const req = { method: "POST", body, headers: {} } as unknown as NextApiRequest;
  const mock = createMockRes();
  await handler(req, mock.res);
  return mock;
};

describe("POST /api/process", () => {
  it("returns processedText, cardCount, and DONE status", async () => {
    const rawText = "Prva recenica. Druga recenica. Treca recenica.";
    const mock = await callHandler({
      rawText,
      serviceType: ServiceType.LEKTURA,
      textType: "akademski rad",
      language: "srpski",
    });

    const json = mock.getJson() as {
      original: string;
      edited: string;
      diff: unknown[];
      cardCount: number;
      status: string;
    };

    expect(mock.getStatus()).toBe(200);
    expect(json.edited).toContain("TEKST:\n" + rawText);
    expect(json.cardCount).toBe(1);
    expect(json.status).toBe("DONE");
  });

  it("rejects empty rawText", async () => {
    const mock = await callHandler({
      rawText: "",
      serviceType: ServiceType.LEKTURA,
      textType: "akademski rad",
      language: "srpski",
    });

    expect(mock.getStatus()).toBe(400);
  });

  it("returns one card for short text", async () => {
    const rawText = "a".repeat(1000);
    const mock = await callHandler({
      rawText,
      serviceType: ServiceType.BOTH,
      textType: "knjiga",
      language: "srpski",
    });

    const json = mock.getJson() as { cardCount: number };

    expect(mock.getStatus()).toBe(200);
    expect(json.cardCount).toBe(1);
  });

  it("returns multiple cards for long text and preserves order", async () => {
    const firstChunk = "a".repeat(1500);
    const secondChunk = "b".repeat(1);
    const rawText = firstChunk + secondChunk;
    const mock = await callHandler({
      rawText,
      serviceType: ServiceType.KOREKTURA,
      textType: "clanak",
      language: "srpski",
    });

    const json = mock.getJson() as {
      edited: string;
      cardCount: number;
    };

    expect(mock.getStatus()).toBe(200);
    expect(json.cardCount).toBe(2);
    expect(json.edited.indexOf("TEKST:\n" + firstChunk)).toBeLessThan(
      json.edited.indexOf("TEKST:\n" + secondChunk)
    );
  });

  it("rejects invalid serviceType or textType", async () => {
    const invalidService = await callHandler({
      rawText: "Test.",
      serviceType: "INVALID",
      textType: "akademski rad",
      language: "srpski",
    });

    const invalidTextType = await callHandler({
      rawText: "Test.",
      serviceType: ServiceType.LEKTURA,
      textType: "",
      language: "srpski",
    });

    const invalidLanguage = await callHandler({
      rawText: "Test.",
      serviceType: ServiceType.LEKTURA,
      textType: "akademski rad",
      language: "invalid",
    });

    expect(invalidService.getStatus()).toBe(400);
    expect(invalidTextType.getStatus()).toBe(400);
    expect(invalidLanguage.getStatus()).toBe(400);
  });

  it("returns LLM_ERROR when adapter fails", async () => {
    const mockedGenerate = vi.mocked(generate);
    mockedGenerate.mockRejectedValueOnce(new Error("LLM down"));

    const mock = await callHandler({
      rawText: "Test.",
      serviceType: ServiceType.LEKTURA,
      textType: "akademski rad",
      language: "srpski",
    });

    const json = mock.getJson() as {
      success: boolean;
      error: { code: string; message: string };
    };

    expect(mock.getStatus()).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("LLM_ERROR");
  });
});

describe("AIProcessor", () => {
  it("preserves order and uses the correct prompt type", async () => {
    const processor = new AIProcessor();

    const job: Job = {
      id: "job-1",
      rawText: "AB",
      serviceType: ServiceType.KOREKTURA,
      textType: "akademski rad",
      language: "srpski",
      cardCount: 2,
      status: JobStatus.CREATED,
      createdAt: new Date().toISOString(),
    };

    const cards = [
      { index: 1, content: "B", charCount: 1 },
      { index: 0, content: "A", charCount: 1 },
    ];

    const output = await processor.process(job, cards);

    expect(output).toContain("ULOGA:");
    expect(output.indexOf("TEKST:\nA")).toBeLessThan(output.indexOf("TEKST:\nB"));
  });
});
