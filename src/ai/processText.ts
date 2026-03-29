import crypto from "crypto";
import { AIProcessor } from "./processor";
import { segmentText } from "../core/segmenter";
import {
  Job,
  JobStatus,
  Language,
  ServiceType,
  TextType,
} from "../core/models";

const processor = new AIProcessor();

/** Upper bound on model output length vs input (defense against runaway / injected replies). */
const assertReasonableOutputSize = (sourceChars: number, outputChars: number) => {
  const cap = Math.min(
    200_000,
    Math.max(sourceChars * 8, sourceChars + 25_000)
  );
  if (outputChars > cap) {
    throw new Error("LLM_OUTPUT_BOUNDS");
  }
};

export const processText = async (
  content: string,
  serviceType: ServiceType,
  textType: TextType,
  language: Language
) => {
  const cards = segmentText(content);

  const job: Job = {
    id: crypto.randomUUID(),
    rawText: content,
    serviceType,
    textType,
    language,
    cardCount: cards.length,
    status: JobStatus.CREATED,
    createdAt: new Date().toISOString(),
  };

  const edited = await processor.process(job, cards);
  assertReasonableOutputSize(content.length, edited.length);

  return {
    edited,
    cardCount: cards.length,
  };
};
