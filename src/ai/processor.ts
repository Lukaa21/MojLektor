import { Job, ServiceType, TextCard } from "../core/models";
import { generate } from "./llmAdapter";
import { buildPromptForService } from "./prompts";

export type ProcessedCard = {
  index: number;
  content: string;
};

export class AIProcessor {
  async process(job: Job, cards: TextCard[]): Promise<string> {
    const results: ProcessedCard[] = [];
    const orderedCards = [...cards].sort((a, b) => a.index - b.index);

    for (const card of orderedCards) {
      const prompt = buildPromptForService(
        job.serviceType,
        card.content,
        job.textType,
        job.language
      );
      const content = await generate(prompt);

      results.push({ index: card.index, content });
    }

    results.sort((a, b) => a.index - b.index);
    return results.map((item) => item.content).join("");
  }
}
