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

  return {
    edited,
    cardCount: cards.length,
  };
};
