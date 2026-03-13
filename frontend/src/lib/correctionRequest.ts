import {
  postJson,
  type Language,
  type ProcessResponse,
  type ServiceType,
  type ReversibleChange,
  type ReversibleToken,
} from "./api";
import { demoTexts, type DemoTextTypeKey } from "../data/demoTexts";
import { demoOutputs } from "../data/demoOutputs";
import { createFullDiff } from "../../../src/core/diff";
import { MAX_CARD_CHARS } from "../../../src/core/segmenter";

export type CorrectionRequestInput = {
  rawText: string;
  serviceType: ServiceType;
  textType: string;
  language: Language;
};

export const processCorrectionRequest = (input: CorrectionRequestInput) =>
  postJson<ProcessResponse>("/api/process", input);

const mapTextTypeToDemoKey = (textType: string): DemoTextTypeKey =>
  textType === "clanak" ? "clanak" : "akademski";

const mapServiceToDemoMode = (serviceType: ServiceType) => {
  if (serviceType === "LEKTURA") return "lektura" as const;
  if (serviceType === "KOREKTURA") return "korektura" as const;
  return "kombinacija" as const;
};

const buildTokensFromChanges = (
  correctedText: string,
  changes: ReversibleChange[]
): ReversibleToken[] => {
  if (!changes.length) {
    return [
      {
        id: "token_demo_static",
        text: correctedText,
        startIndex: 0,
        endIndex: correctedText.length,
        status: "static",
      },
    ];
  }

  const ordered = [...changes]
    .filter((change) => Number.isFinite(change.startIndex) && Number.isFinite(change.endIndex))
    .sort((a, b) => a.startIndex - b.startIndex);

  const tokens: ReversibleToken[] = [];
  let cursor = 0;
  let tokenIndex = 0;

  for (const change of ordered) {
    if (change.startIndex > cursor) {
      tokens.push({
        id: `token_demo_static_${tokenIndex}`,
        text: correctedText.slice(cursor, change.startIndex),
        startIndex: cursor,
        endIndex: change.startIndex,
        status: "static",
      });
      tokenIndex += 1;
    }

    tokens.push({
      id: `token_demo_change_${tokenIndex}`,
      text: correctedText.slice(change.startIndex, change.endIndex),
      startIndex: change.startIndex,
      endIndex: change.endIndex,
      changeId: change.id,
      groupKey: change.groupKey,
      status: change.status,
    });
    tokenIndex += 1;
    cursor = change.endIndex;
  }

  if (cursor < correctedText.length) {
    tokens.push({
      id: `token_demo_static_${tokenIndex}`,
      text: correctedText.slice(cursor),
      startIndex: cursor,
      endIndex: correctedText.length,
      status: "static",
    });
  }

  return tokens;
};

const wait = (durationMs: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });

export const processDemoCorrectionRequest = async (
  input: CorrectionRequestInput
): Promise<ProcessResponse> => {
  await wait(4000);

  const textTypeKey = mapTextTypeToDemoKey(input.textType);
  const modeKey = mapServiceToDemoMode(input.serviceType);
  const output = demoOutputs[textTypeKey][modeKey];
  const originalText = demoTexts[textTypeKey] || input.rawText;

  const correctedText = output.correctedText;
  const fullDiff = createFullDiff(originalText, correctedText);
  const changes = output.changes.length ? output.changes : fullDiff.changes;
  const tokens = buildTokensFromChanges(correctedText, changes);
  const cardCount = Math.max(1, Math.ceil(correctedText.length / MAX_CARD_CHARS));

  return {
    original: originalText,
    edited: correctedText,
    diff: fullDiff.diff,
    changes,
    tokens,
    cardCount,
    status: "DONE",
  };
};
